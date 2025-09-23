'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase auth errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('auth/user-not-found')) {
        setErrors({ email: 'No account found with this email address' });
      } else if (errorMessage.includes('auth/invalid-email')) {
        setErrors({ email: 'Invalid email address' });
      } else if (errorMessage.includes('auth/too-many-requests')) {
        setErrors({ general: 'Too many attempts. Please try again later.' });
      } else {
        setErrors({ general: 'Failed to send reset email. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] lg:flex lg:h-screen lg:overflow-hidden">
        {/* Left Image Panel - Desktop Only */}
        <div 
          className="hidden lg:block lg:w-3/5 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(120, 0, 0, 0.15) 0%, rgba(120, 0, 0, 0.1) 50%, rgba(120, 0, 0, 0.05) 100%), url('/side image.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
        </div>

        {/* Right Success Panel */}
        <div className="flex-1 lg:w-2/5 flex flex-col justify-center min-h-screen lg:h-screen bg-white p-6 lg:p-8">
          <div className="w-full max-w-md mx-auto text-center">
            {/* Mobile Brand Header */}
            <div className="lg:hidden mb-6">
              <Link href="/" className="inline-block">
                <Image 
                  src="/small logo iuea.png" 
                  alt="IUEA Logo" 
                  width={128}
                  height={128}
                  className="w-32 h-32 mx-auto mb-3 object-contain hover:opacity-80 transition-opacity cursor-pointer"
                />
              </Link>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-6">
              <Link href="/" className="inline-block">
                <Image 
                  src="/small logo iuea.png" 
                  alt="IUEA Logo" 
                  width={160}
                  height={160}
                  className="w-40 h-40 mx-auto mb-3 object-contain hover:opacity-80 transition-opacity cursor-pointer"
                />
              </Link>
            </div>

            {/* Success Message */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-send-line text-green-600 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-[#333333] mb-2">Check Your Email</h2>
              <p className="text-[#333333]/70 mb-4">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="text-[#780000] font-medium mb-4">{email}</p>
              <p className="text-sm text-[#333333]/60">
                Click the link in your email to reset your password. If you don&apos;t see it, check your spam folder.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setErrors({});
                }}
                className="w-full bg-[#780000] hover:bg-[#600000] text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Send Another Email
              </button>
              
              <Link
                href="/login"
                className="block w-full text-center py-3 px-4 rounded-lg border-2 border-[#780000] text-[#780000] hover:bg-[#780000] hover:text-white transition-colors font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] lg:flex lg:h-screen lg:overflow-hidden">
      {/* Left Image Panel - Desktop Only */}
      <div 
        className="hidden lg:block lg:w-3/5 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(120, 0, 0, 0.15) 0%, rgba(120, 0, 0, 0.1) 50%, rgba(120, 0, 0, 0.05) 100%), url('/side image.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 lg:w-2/5 flex flex-col justify-center min-h-screen lg:h-screen bg-white p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-block">
              <Image 
                src="/small logo iuea.png" 
                alt="IUEA Logo" 
                width={128}
                height={128}
                className="w-32 h-32 mx-auto mb-3 object-contain hover:opacity-80 transition-opacity cursor-pointer"
              />
            </Link>
            <h1 className="text-xl font-bold text-[#333333] mb-2">Reset Password</h1>
            <p className="text-[#333333]/70 text-sm">Enter your email to receive reset instructions</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-6">
            <Link href="/" className="inline-block">
              <Image 
                src="/small logo iuea.png" 
                alt="IUEA Logo" 
                width={160}
                height={160}
                className="w-40 h-40 mx-auto mb-3 object-contain hover:opacity-80 transition-opacity cursor-pointer"
              />
            </Link>
            <h2 className="text-2xl font-bold text-[#333333] mb-1">Reset Password</h2>
            <p className="text-[#333333]/70">Enter your email to receive reset instructions</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Display */}
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#333333] mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-base placeholder:text-gray-400 text-black ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-[#EDEDED] focus:border-[#780000]'
                } focus:outline-none`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <i className="ri-information-line text-blue-600 text-sm mt-0.5"></i>
                <p className="text-xs text-blue-700">
                  We&apos;ll send you a secure link to reset your password. Make sure to check your spam folder if you don&apos;t see the email within a few minutes.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#780000] hover:bg-[#600000] text-white cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <p className="text-sm text-[#333333]">
                Remember your password?{` `} 
                <Link href="/login" className="text-[#780000] hover:underline font-medium">
                  Back to login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
