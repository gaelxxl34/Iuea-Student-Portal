import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
  sendEmailVerification,
  reload,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  applicationStatus?: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
}

// Sign up with email and password via backend
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  whatsappNumber: string
): Promise<User> => {
  try {
    console.log('🚀 Registering user via backend API:', email);
    
    // Call backend registration endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        whatsappNumber,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Registration failed');
    }
    
    console.log('✅ User registered successfully via backend');
    
    // Now sign in the user to get the Firebase User object
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
    
  } catch (error) {
    console.error('Error creating user via backend:', error);
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

// Get user data from backend API instead of direct Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    console.log('🔍 Fetching user data from Firestore users collection for UID:', uid);
    
    // Fetch directly from Firestore users collection
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
        applicationStatus: userData.applicationStatus,
      };
      
      console.log('✅ Formatted user data:', formattedUserData);
      return formattedUserData;
    } else {
      console.log('❌ No user document found in Firestore for UID:', uid);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting user data from Firestore:', error);
    // Fallback: try to get basic user data from Firebase Auth
    try {
      const user = auth.currentUser;
      if (user) {
        const userData: UserData = {
          uid: user.uid,
          email: user.email || '',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          whatsappNumber: '',
          createdAt: new Date(),
        };
        console.log('⚠️ Using fallback user data from Firebase Auth:', userData);
        return userData;
      }
    } catch (fallbackError) {
      console.error('Fallback user data fetch also failed:', fallbackError);
    }
    throw error;
  }
};

// Update user data via backend API instead of direct Firestore
export const updateUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  try {
    // Get the Firebase ID token for authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const idToken = await user.getIdToken();
    
    // Call your backend API to update user data
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/users/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        uid,
        ...data,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ User data updated via backend');
  } catch (error) {
    console.error('Error updating user data via backend:', error);
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
