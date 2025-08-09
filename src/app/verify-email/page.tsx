'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, resendVerificationEmail, checkEmailVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [autoChecking, setAutoChecking] = useState(true);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (user === null) {
      router.push('/login');
      return;
    }

    // If user is already verified, redirect to dashboard
    if (user && user.emailVerified) {
      router.push('/dashboard');
      return;
    }

    // Set up interval to periodically check verification status
    const checkInterval = setInterval(async () => {
      if (user) {
        try {
          const isVerified = await checkEmailVerification();
          if (isVerified) {
            clearInterval(checkInterval);
            setAutoChecking(false);
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      }
    }, 3000); // Check every 3 seconds

    // Stop auto checking after 5 minutes
    const stopAutoCheckTimeout = setTimeout(() => {
      setAutoChecking(false);
      clearInterval(checkInterval);
    }, 300000); // 5 minutes

    // Cleanup interval on unmount
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (stopAutoCheckTimeout) {
        clearTimeout(stopAutoCheckTimeout);
      }
    };
  }, [user, router, checkEmailVerification]);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setResendMessage('');
      await resendVerificationEmail();
      setResendMessage('Verification email sent successfully! Please check your inbox.');
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      if (error.message === 'Email is already verified') {
        setResendMessage('Your email is already verified!');
        router.push('/dashboard');
      } else {
        setResendMessage('Failed to send verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        router.push('/dashboard');
      } else {
        setResendMessage('Email is not yet verified. Please check your email and click the verification link.');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setResendMessage('Failed to check verification status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  // Don't render anything while user state is loading
  if (user === null) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780000]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-mail-line text-2xl text-blue-600"></i>
        </div>
        
        <h2 className="text-2xl font-bold text-[#333333] mb-2">Verify Your Email</h2>
        
        <p className="text-[#333333]/70 mb-6">
          Please check your email at <strong>{user?.email}</strong> and click the verification link to activate your account.
        </p>

        {autoChecking && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Automatically checking for verification...</span>
            </div>
          </div>
        )}

        {resendMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            resendMessage.includes('successfully') || resendMessage.includes('already verified')
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {resendMessage}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={isChecking}
            className="w-full bg-[#780000] hover:bg-[#600000] disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isChecking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Checking...</span>
              </div>
            ) : (
              'I\'ve verified my email'
            )}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-[#333333] font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isResending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Resend verification email'
            )}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-[#333333]/60 mb-3">
              Didn't receive the email? Check your spam folder.
            </p>
            <Link 
              href="/login" 
              className="text-[#780000] hover:underline text-sm font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
