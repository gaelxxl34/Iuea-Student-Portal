import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  sendEmailVerification,
  reload,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { studentApplicationService } from './applicationService';
import authEmailService from '../services/authEmailService';

// Lead status constants (matching backend)
const LEAD_STATUSES = {
  CONTACTED: "CONTACTED",
  INTERESTED: "INTERESTED", 
  APPLIED: "APPLIED",
  MISSING_DOCUMENT: "MISSING_DOCUMENT",
  IN_REVIEW: "IN_REVIEW",
  QUALIFIED: "QUALIFIED",
  ADMITTED: "ADMITTED",
  ENROLLED: "ENROLLED",
  DEFERRED: "DEFERRED",
  EXPIRED: "EXPIRED",
} as const;

// User data interface
export interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  whatsappNumber: string;
  createdAt: Date;
  lastLogin?: Date;
  applicationStatus?: 'interested' | 'applied' | 'in_review' | 'qualified' | 'admitted' | 'enrolled' | 'deferred' | 'expired';
  submittedBy?: string;
}

// Lead creation function with duplicate checking
const createLeadFromSignup = async (
  user: User,
  firstName: string,
  lastName: string,
  email: string,
  whatsappNumber: string,
  submittedBy?: string
): Promise<void> => {
  try {
    console.log('📋 Creating lead from student signup with duplicate checking...');
    
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    
    // 🔍 Step 1: Check for existing leads using the public signup method
    let existingLead = null;
    try {
      console.log(`🔍 Checking for existing lead with email: ${email} or phone: ${whatsappNumber}`);
      
      // Use the new public method specifically designed for signup flow
      // This method does NOT filter by UID, allowing us to find leads created by agents/chatbots
      existingLead = await studentApplicationService.findExistingLeadForSignup(email, whatsappNumber);
      
    } catch (duplicateCheckError) {
      console.error('⚠️ Error checking for existing leads:', {
        error: duplicateCheckError instanceof Error ? duplicateCheckError.message : 'Unknown error',
        email,
        phone: whatsappNumber,
        timestamp: new Date().toISOString()
      });
      // Continue with creating new lead if duplicate checking fails
    }
    
    // 🎯 Step 2: Handle existing lead scenarios
    if (existingLead) {
      console.log(`📋 Found existing lead ${existingLead.id} with status: ${existingLead.status}`);
      
      // Scenario: Update CONTACTED leads to INTERESTED
      if (existingLead.status === LEAD_STATUSES.CONTACTED) {
        try {
          console.log(`🔄 Updating existing CONTACTED lead ${existingLead.id} to INTERESTED status`);
          
          // Prepare update data
          const updateData: Record<string, unknown> = {
            status: LEAD_STATUSES.INTERESTED,
            updatedAt: new Date(),
            name: fullName, // Update name in case it's different
            // 🔧 FIX: Update UID to the new user's UID for proper ownership
            uid: user.uid,
          };
          
          // Add timeline entry for the status change
          const newTimelineEntry = {
            date: new Date(),
            action: "STATUS_UPDATED",
            status: LEAD_STATUSES.INTERESTED,
            notes: submittedBy 
              ? `Status updated from CONTACTED to INTERESTED due to applicant portal signup - Assisted by: ${submittedBy}`
              : "Status updated from CONTACTED to INTERESTED due to applicant portal signup",
            metadata: {
              source: "APPLICANT_PORTAL_SIGNUP",
              submittedBy: submittedBy || "direct",
              previousStatus: LEAD_STATUSES.CONTACTED,
              newOwnerUid: user.uid, // Track ownership change
            }
          };
          
          // Append to existing timeline
          updateData.timeline = [...(existingLead.timeline || []), newTimelineEntry];
          
          // Update the lead document
          const leadRef = doc(db, 'leads', existingLead.id);
          await updateDoc(leadRef, updateData);
          
          console.log(`✅ Successfully updated existing lead ${existingLead.id} from CONTACTED to INTERESTED`);
          return; // Exit early, no need to create new lead
          
        } catch (updateError) {
          console.error(`❌ CRITICAL: Failed to update existing lead ${existingLead.id}:`, {
            error: updateError instanceof Error ? updateError.message : 'Unknown error',
            leadId: existingLead.id,
            email,
            timestamp: new Date().toISOString()
          });
          // Continue to create new lead if update fails
        }
      } 
      // Scenario: Lead already INTERESTED or higher status
      else if (existingLead.status === LEAD_STATUSES.INTERESTED) {
        console.log(`ℹ️ Lead already has INTERESTED status, updating contact info and ownership if needed`);
        
        try {
          // Update the name, UID ownership, and add timeline entry for signup
          const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
            name: fullName, // Update name in case it's different
            // 🔧 FIX: Update UID to the new user's UID for proper ownership
            uid: user.uid,
          };
          
          // Add timeline entry for the signup attempt
          const newTimelineEntry = {
            date: new Date(),
            action: "SIGNUP_ATTEMPT",
            status: existingLead.status,
            notes: submittedBy 
              ? `Applicant portal signup attempted for existing INTERESTED lead - Assisted by: ${submittedBy}`
              : "Applicant portal signup attempted for existing INTERESTED lead",
            metadata: {
              source: "APPLICANT_PORTAL_SIGNUP",
              submittedBy: submittedBy || "direct",
              newOwnerUid: user.uid, // Track ownership transfer
            }
          };
          
          updateData.timeline = [...(existingLead.timeline || []), newTimelineEntry];
          
          const leadRef = doc(db, 'leads', existingLead.id);
          await updateDoc(leadRef, updateData);
          
          console.log(`✅ Updated existing INTERESTED lead ${existingLead.id} with signup info and ownership`);
          return; // Exit early, no need to create new lead
          
        } catch (updateError) {
          console.error(`❌ CRITICAL: Failed to update existing INTERESTED lead:`, {
            error: updateError instanceof Error ? updateError.message : 'Unknown error',
            leadId: existingLead.id,
            email,
            timestamp: new Date().toISOString()
          });
          // Continue to create new lead if update fails
        }
      } 
      // Scenario: Lead has APPLIED or higher status  
      else {
        console.log(`ℹ️ Lead already has status ${existingLead.status} (APPLIED or higher), updating ownership only`);
        
        // Even for APPLIED+ leads, we should update the UID for ownership
        try {
          const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
            uid: user.uid, // Transfer ownership to the new user
          };
          
          const newTimelineEntry = {
            date: new Date(),
            action: "OWNERSHIP_TRANSFER",
            status: existingLead.status,
            notes: "Lead ownership transferred to student user account",
            metadata: {
              source: "APPLICANT_PORTAL_SIGNUP",
              newOwnerUid: user.uid,
            }
          };
          
          updateData.timeline = [...(existingLead.timeline || []), newTimelineEntry];
          
          const leadRef = doc(db, 'leads', existingLead.id);
          await updateDoc(leadRef, updateData);
          
          console.log(`✅ Transferred ownership of lead ${existingLead.id} to user ${user.uid}`);
        } catch (updateError) {
          console.error(`❌ Warning: Failed to transfer lead ownership:`, {
            error: updateError instanceof Error ? updateError.message : 'Unknown error',
            leadId: existingLead.id,
            email,
            timestamp: new Date().toISOString()
          });
        }
        
        return; // Exit early, no need to create new lead
      }
    }
    
    // 🆕 Step 3: Create new lead if no existing lead found or updates failed
    console.log('✨ Creating new lead for signup');
    
    const leadData = {
      // Required fields
      status: LEAD_STATUSES.INTERESTED,
      source: "APPLICANT_PORTAL", 
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Contact info
      name: fullName,
      email: email,
      phone: whatsappNumber,
      whatsappNumber: whatsappNumber,
      
      // 🔧 FIX: Set proper UID ownership for new user
      uid: user.uid,
      
      // Agent/Source attribution
      submittedBy: submittedBy || "direct",
      
      // Timeline with initial entry
      timeline: [{
        date: new Date(),
        action: "CREATED",
        status: LEAD_STATUSES.INTERESTED,
        notes: submittedBy 
          ? `Lead created from applicant portal signup - Assisted by: ${submittedBy}`
          : "Lead created from applicant portal signup",
        metadata: {
          whatsappMessageSent: false,
          emailNotificationSent: false,
          submittedBy: submittedBy || "direct",
          source: "APPLICANT_PORTAL_SIGNUP",
          ownerUid: user.uid, // Track initial owner
        }
      }],
      
      // Creation tracking
      createdBy: {
        uid: user.uid,
        email: email,
        name: fullName,
        role: "student",
        assistedBy: submittedBy || "direct"
      }
    };
    
    // Save to Firestore leads collection
    const leadsCollection = collection(db, 'leads');
    const leadDocRef = await addDoc(leadsCollection, leadData);
    
    console.log('✅ New lead created with ID:', leadDocRef.id, submittedBy ? `- Assisted by: ${submittedBy}` : '- Direct signup');
    
  } catch (error) {
    console.error('❌ CRITICAL: Error in lead creation/update from signup:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email,
      phone: whatsappNumber,
      timestamp: new Date().toISOString(),
      userUid: user.uid
    });
    
    // 🚨 IMPORTANT: Don't throw error - lead creation failure shouldn't break signup
    // The user account is already created, so we want them to be able to sign in
    // We just log the error for monitoring and investigation
    
    // TODO: Consider sending this error to a monitoring service (e.g., Sentry, LogRocket)
    // This will help track how often this happens and why
  }
};

// Sign up with email and password using Firebase Auth directly
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  whatsappNumber: string,
  submittedBy?: string
): Promise<User> => {
  try {
    console.log('🚀 Creating user with Firebase Auth:', email, submittedBy ? `- Assisted by: ${submittedBy}` : '- Direct signup');
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User created with Firebase Auth, UID:', user.uid);
    
    // Store additional user data in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || email,
      firstName,
      lastName,
      whatsappNumber,
      createdAt: new Date(),
      applicationStatus: 'interested',
      submittedBy: submittedBy || 'direct'
    };
    
    // Save to Firestore users collection
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, userData);
    
    console.log('✅ User data saved to Firestore');
    
    // Create lead from signup with submittedBy info
    await createLeadFromSignup(user, firstName, lastName, email, whatsappNumber, submittedBy);
    
    // ⚠️ NOTE: Welcome email is NOT sent during signup
    // It will be sent automatically on first login via the dashboard welcome flow
    // This prevents duplicate welcome emails (one during signup + one on first login)
    
    // Send custom branded email verification instead of Firebase's default
    try {
      console.log('📧 Sending custom branded email verification...');
      const verificationResult = await authEmailService.sendCustomEmailVerification({
        email: user.email || email,
        userName: `${firstName} ${lastName}`,
        phoneNumber: whatsappNumber, // 📱 Include phone number for WhatsApp notification
      });
      
      if (verificationResult.success) {
        console.log('✅ Custom email verification sent successfully');
      } else {
        console.warn('⚠️ Custom email verification failed:', verificationResult.error);
        // Fallback to Firebase's default email verification if custom fails
        await sendEmailVerification(user);
        console.log('✅ Fallback Firebase email verification sent');
      }
    } catch (emailError) {
      console.warn('⚠️ Email verification error, using Firebase fallback:', emailError);
      // Fallback to Firebase's default email verification
      await sendEmailVerification(user);
      console.log('✅ Fallback Firebase email verification sent');
    }
    
    return user;
    
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    console.log('🔍 Fetching user data from Firestore for UID:', uid);
    
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User data found in Firestore:', userData);
      
      const formattedUserData: UserData = {
        uid: userData.uid || uid,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        whatsappNumber: userData.whatsappNumber || '',
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLogin: userData.lastLogin?.toDate(),
        applicationStatus: userData.applicationStatus || 'interested',
        submittedBy: userData.submittedBy || 'direct',
      };
      
      return formattedUserData;
    } else {
      console.log('❌ No user document found in Firestore for UID:', uid);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting user data from Firestore:', error);
    throw error;
  }
};

// Update user data in Firestore
export const updateUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  try {
    console.log('📝 Updating user data in Firestore for UID:', uid);
    
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ User data updated in Firestore');
  } catch (error) {
    console.error('❌ Error updating user data in Firestore:', error);
    throw error;
  }
};

// Resend email verification with custom branded email
export const resendEmailVerification = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Get user data to personalize the email
    const userData = await getUserData(user.uid);
    const userName = userData 
      ? `${userData.firstName} ${userData.lastName}`.trim() 
      : 'Student';

    // Try to send custom branded email verification first
    try {
      console.log('📧 Resending custom branded email verification...');
      const verificationResult = await authEmailService.sendCustomEmailVerification({
        email: user.email || '',
        userName: userName,
      });
      
      if (verificationResult.success) {
        console.log('✅ Custom email verification resent successfully');
        return;
      } else {
        console.warn('⚠️ Custom email verification failed:', verificationResult.error);
        throw new Error(verificationResult.error);
      }
    } catch (customEmailError) {
      console.warn('⚠️ Custom email verification failed, using Firebase fallback:', customEmailError);
      // Fallback to Firebase's default email verification
      await sendEmailVerification(user);
      console.log('✅ Fallback Firebase email verification sent');
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
};

// Check email verification status
export const checkEmailVerification = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }
    
    // Reload user to get latest verification status from Firebase Auth
    await reload(user);
    
    // Update last login if verified
    if (user.emailVerified) {
      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, { 
        lastLogin: new Date() 
      }, { merge: true });
    }
    
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
};

// Sign in for unverified users (to allow access to verification page)
export const signInUnverified = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Send custom branded password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    // Try to get user data to personalize the email
    let userName = 'Student';
    try {
      // Look up user by email to get their name
      // This is a basic lookup - you might want to implement a more efficient method
      // Note: This would require creating an index in Firestore for email queries
      // For now, we'll use a generic name and improve this later
      userName = 'Student';
    } catch (lookupError) {
      console.warn('Could not lookup user name for password reset:', lookupError);
    }

    // Try to send custom branded password reset email first
    try {
      console.log('📧 Sending custom branded password reset email...');
      const resetResult = await authEmailService.sendCustomPasswordReset({
        email: email,
        userName: userName,
      });
      
      if (resetResult.success) {
        console.log('✅ Custom password reset email sent successfully');
        return;
      } else {
        console.warn('⚠️ Custom password reset failed:', resetResult.error);
        throw new Error(resetResult.error);
      }
    } catch (customEmailError) {
      console.warn('⚠️ Custom password reset failed, using Firebase fallback:', customEmailError);
      // Fallback to Firebase's default password reset email
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Fallback Firebase password reset sent');
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
