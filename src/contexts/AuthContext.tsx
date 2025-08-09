'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  getUserData, 
  UserData, 
  signUpWithEmail, 
  signInWithEmail, 
  signInUnverified,
  resendEmailVerification,
  checkEmailVerification,
  sendPasswordReset
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, whatsappNumber: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInUnverified: (email: string, password: string) => Promise<User>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  signUp: async () => { throw new Error('AuthContext not initialized'); },
  signIn: async () => { throw new Error('AuthContext not initialized'); },
  signInUnverified: async () => { throw new Error('AuthContext not initialized'); },
  resendVerificationEmail: async () => { throw new Error('AuthContext not initialized'); },
  checkEmailVerification: async () => { throw new Error('AuthContext not initialized'); },
  resetPassword: async () => { throw new Error('AuthContext not initialized'); }
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          // If user is verified in Firebase Auth but not in Firestore, update Firestore
          if (user.emailVerified) {
            const data = await getUserData(user.uid);
            if (data && !data.emailVerified) {
              // Update Firestore with verified status
              const { updateUserData } = await import('@/lib/auth');
              await updateUserData(user.uid, { emailVerified: true });
              // Refetch user data with updated verification status
              const updatedData = await getUserData(user.uid);
              setUserData(updatedData);
            } else {
              setUserData(data);
            }
          } else {
            const data = await getUserData(user.uid);
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { signOutUser } = await import('@/lib/auth');
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    whatsappNumber: string
  ) => {
    return await signUpWithEmail(email, password, firstName, lastName, whatsappNumber);
  };

  const handleSignIn = async (email: string, password: string) => {
    return await signInWithEmail(email, password);
  };

  const handleSignInUnverified = async (email: string, password: string) => {
    return await signInUnverified(email, password);
  };

  const handleResendVerificationEmail = async () => {
    return await resendEmailVerification();
  };

  const handleCheckEmailVerification = async () => {
    return await checkEmailVerification();
  };

  const handleResetPassword = async (email: string) => {
    return await sendPasswordReset(email);
  };

  const value = {
    user,
    userData,
    loading,
    signOut: handleSignOut,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInUnverified: handleSignInUnverified,
    resendVerificationEmail: handleResendVerificationEmail,
    checkEmailVerification: handleCheckEmailVerification,
    resetPassword: handleResetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
