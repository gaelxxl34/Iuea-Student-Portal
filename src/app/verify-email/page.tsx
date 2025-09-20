"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import metaPixel from "@/lib/metaPixel";
import { applyActionCode, reload, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, resendVerificationEmail, checkEmailVerification, refreshUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [autoChecking, setAutoChecking] = useState(true);
  const [verifyingFromLink, setVerifyingFromLink] = useState(false);
  const [linkVerificationMessage, setLinkVerificationMessage] = useState<string>("");

  useEffect(() => {
    // Track page view
    metaPixel.trackPageView("Email Verification Page");

    // 1) If arrived with Firebase action code in URL, process it first before any redirects
    const mode = searchParams?.get("mode");
    const oobCode = searchParams?.get("oobCode");
    if (mode === "verifyEmail" && oobCode) {
      setVerifyingFromLink(true);
      setLinkVerificationMessage("");
      (async () => {
        try {
          await applyActionCode(auth, oobCode);
          // Refresh current user if signed in to reflect verified status
          if (auth.currentUser) {
            await reload(auth.currentUser);
            await refreshUser();
          }
          // Track verification
          const verifiedEmail = auth.currentUser?.email || searchParams?.get("email") || "";
          if (verifiedEmail) {
            metaPixel.trackEmailVerification(verifiedEmail);
          }
          // Always redirect to login after verification; sign out if currently signed in
          try {
            if (auth.currentUser) {
              await signOut(auth);
            }
          } catch {}
          router.replace("/login?verified=1");
          return; // Stop further processing in this effect
        } catch (err) {
          console.error("Error applying email verification code:", err);
          setLinkVerificationMessage("Failed to verify the link. It may have expired. Please request a new verification email.");
          setVerifyingFromLink(false);
        }
      })();
      return; // Don't run the rest of the effect while handling link
    }

    // If user is not logged in, redirect to login
    if (user === null) {
      router.push("/login");
      return;
    }

    // If user is already verified, redirect to dashboard
    if (user && user.emailVerified) {
      // Track email verification completion
      metaPixel.trackEmailVerification(user.email || '');
      router.push('/dashboard');
      return;
    }

    // Set up interval to periodically check verification status
    const checkInterval = setInterval(async () => {
      if (user && autoChecking) {
        try {
        // First refresh the user to get latest status from Firebase
          await refreshUser();
          
          // Then check verification
          const isVerified = await checkEmailVerification();
          if (isVerified) {
            clearInterval(checkInterval);
            setAutoChecking(false);
            
            // 🎯 TRACK EMAIL VERIFICATION TO META
            if (user?.email) {
              metaPixel.trackEmailVerification(user.email);
              console.log("🎯 Meta Pixel: Email verification tracked for", user.email);
            }
            
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      }
    }, 2000); // Check every 2 seconds for better responsiveness

    // Stop auto checking after 3 minutes (reduced from 5)
    const stopAutoCheckTimeout = setTimeout(() => {
      setAutoChecking(false);
      clearInterval(checkInterval);
    }, 180000); // 3 minutes

    // Cleanup interval on unmount
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (stopAutoCheckTimeout) {
        clearTimeout(stopAutoCheckTimeout);
      }
    };
  }, [user, router, checkEmailVerification, refreshUser, autoChecking]);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setResendMessage("");
      await resendVerificationEmail();
      setResendMessage("Verification email sent successfully! Please check your inbox.");
    } catch (error: unknown) {
      console.error("Error resending verification email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage === "Email is already verified") {
        setResendMessage("Your email is already verified!");
        router.push("/dashboard");
      } else {
        setResendMessage("Failed to send verification email. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      // First refresh user state
      await refreshUser();
      // Then check verification
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        router.push("/dashboard");
      } else {
        setResendMessage("Email is not yet verified. Please check your email and click the verification link.");
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setResendMessage("Failed to check verification status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  // Don't render anything while user state is loading
  if (user === null && !verifyingFromLink) {
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
        
        {verifyingFromLink ? (
          <div className="flex items-center justify-center mb-6">
            <div className="w-6 h-6 border-2 border-[#780000] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <p className="text-[#333333]/70 mb-6">
            Please check your email{user?.email ? (
              <> at <strong>{user.email}</strong></>
            ) : null} and click the verification link to activate your account.
          </p>
        )}

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
          {!verifyingFromLink && (
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
          )}

          {!verifyingFromLink && (
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
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-[#333333]/60 mb-3">
              Didn&apos;t receive the email? Check your spam folder.
            </p>
            {!verifyingFromLink && (
              <Link 
                href="/login" 
                className="text-[#780000] hover:underline text-sm font-medium"
              >
                Back to Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
