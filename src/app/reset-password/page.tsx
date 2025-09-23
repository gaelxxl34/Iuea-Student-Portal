'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode !== 'resetPassword' || !oobCode) {
      router.push('/forgot-password');
      return;
    }

    // Verify the password reset code
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsValidCode(true);
      } catch (error) {
        console.error('Invalid reset code:', error);
        setIsValidCode(false);
      }
    };

    verifyCode();
  }, [oobCode, mode, router]);

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password)
    };
  };

  const passwordRules = validatePassword(formData.password);
  const passwordStrength = Object.values(passwordRules).filter(Boolean).length;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password must meet all requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await confirmPasswordReset(auth, oobCode!, formData.password);
      // Password reset successful - redirect to login with success message
      router.push('/login?message=password-reset-success');
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('auth/expired-action-code')) {
        setErrors({ general: 'This password reset link has expired. Please request a new one.' });
      } else if (errorMessage.includes('auth/invalid-action-code')) {
        setErrors({ general: 'This password reset link is invalid. Please request a new one.' });
      } else if (errorMessage.includes('auth/weak-password')) {
        setErrors({ password: 'Password is too weak' });
      } else {
        setErrors({ general: 'Failed to reset password. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while verifying code
  if (isValidCode === null) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780000] mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid code state
  if (isValidCode === false) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Invalid Reset Link</h2>
          <p className="text-[#333333]/70 mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <div className="space-y-3">
            <Link 
              href="/forgot-password" 
              className="block w-full bg-[#780000] hover:bg-[#600000] text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Request New Reset Link
            </Link>
            <Link 
              href="/login" 
              className="block w-full text-center text-[#780000] hover:underline"
            >
              Back to Login
            </Link>
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
          backgroundImage: `linear-gradient(135deg, rgba(120, 0, 0, 0.15) 0%, rgba(120, 0, 0, 0.1) 50%, rgba(120, 0, 0, 0.05) 100%), url('https://iuea.ac.ug/blog/wp-content/uploads/2024/11/WhatsApp-Image-2024-11-29-at-12.00.38_29c7f282.jpg')`,
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
            <Image 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              width={128}
              height={128}
              className="w-32 h-32 mx-auto mb-3 object-contain"
            />
            <h1 className="text-xl font-bold text-[#333333] mb-2">Set New Password</h1>
            <p className="text-[#333333]/70 text-sm">Create a new password for your account</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-6">
            <Image 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              width={160}
              height={160}
              className="w-40 h-40 mx-auto mb-3 object-contain"
            />
            <h2 className="text-2xl font-bold text-[#333333] mb-1">Set New Password</h2>
            <p className="text-[#333333]/70">Create a new password for {email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Display */}
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#333333] mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 rounded-lg border-2 transition-colors text-base placeholder:text-gray-400 text-black ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#EDEDED] focus:border-[#780000]'
                  } focus:outline-none`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-[#333333]/60 text-sm`}></i>
                </button>
              </div>

              {/* Password Strength */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          passwordStrength >= level ? 'bg-green-500' : 'bg-[#EDEDED]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className={`flex items-center gap-1 ${passwordRules.length ? 'text-green-600' : 'text-[#333333]/60'}`}>
                      <i className={`ri-${passwordRules.length ? 'check' : 'close'}-line text-xs`}></i>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRules.uppercase ? 'text-green-600' : 'text-[#333333]/60'}`}>
                      <i className={`ri-${passwordRules.uppercase ? 'check' : 'close'}-line text-xs`}></i>
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRules.number ? 'text-green-600' : 'text-[#333333]/60'}`}>
                      <i className={`ri-${passwordRules.number ? 'check' : 'close'}-line text-xs`}></i>
                      <span>One number</span>
                    </div>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#333333] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 rounded-lg border-2 transition-colors text-base placeholder:text-gray-400 text-black ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#EDEDED] focus:border-[#780000]'
                  } focus:outline-none`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <i className={`${showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-[#333333]/60 text-sm`}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
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
                  <span>Updating Password...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link href="/login" className="text-sm text-[#333333] hover:text-[#780000]">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780000] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
