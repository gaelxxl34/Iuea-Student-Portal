import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  sendEmailVerification,
  reload,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

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
}

// Lead creation function
const createLeadFromSignup = async (
  user: User,
  firstName: string,
  lastName: string,
  email: string,
  whatsappNumber: string
): Promise<void> => {
  try {
    console.log('📋 Creating lead from student signup...');
    
    // Create lead document in Firestore
    const leadData = {
      // Required fields
      status: "INTERESTED",
      source: "APPLICANT_PORTAL", 
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Contact info (separated names)
      firstName: firstName,
      lastName: lastName,
      email: email,
      whatsappNumber: whatsappNumber,
      
      // Timeline with initial entry
      timeline: [{
        date: new Date(),
        action: "CREATED",
        status: "INTERESTED",
        notes: "Lead created from applicant portal signup",
        metadata: {
          whatsappMessageSent: false,
          emailNotificationSent: false
        }
      }],
      
      // Creation tracking with email and firstName
      createdBy: {
        uid: user.uid,
        email: email,
        firstName: firstName,
        role: "student"
      }
    };
    
    // Save to Firestore leads collection
    const leadsCollection = collection(db, 'leads');
    const leadDocRef = await addDoc(leadsCollection, leadData);
    
    console.log('✅ Lead created with ID:', leadDocRef.id);
    
  } catch (error) {
    console.error('❌ Error creating lead from signup:', error);
    // Don't throw error - lead creation failure shouldn't break signup
    // Just log it for monitoring
  }
};

// Sign up with email and password using Firebase Auth directly
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  whatsappNumber: string
): Promise<User> => {
  try {
    console.log('🚀 Creating user with Firebase Auth:', email);
    
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
      applicationStatus: 'interested'
    };
    
    // Save to Firestore users collection
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, userData);
    
    console.log('✅ User data saved to Firestore');
    
    // Create lead from signup
    await createLeadFromSignup(user, firstName, lastName, email, whatsappNumber);
    
    // Send email verification
    await sendEmailVerification(user);
    console.log('✅ Email verification sent');
    
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

// Resend email verification
export const resendEmailVerification = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }
    
    await sendEmailVerification(user);
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

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
