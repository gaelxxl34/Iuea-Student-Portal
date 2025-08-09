'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInUnverified } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check for success messages from URL params
    const message = searchParams.get('message');
    if (message === 'password-reset-success') {
      setSuccessMessage('Password reset successful! You can now log in with your new password.');
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) newErrors.password = 'Password is required';

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
      // First try regular sign in (for verified users)
      await signIn(formData.email, formData.password);
      // If successful, redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        // If email is not verified, sign them in with unverified login
        try {
          const user = await signInUnverified(formData.email, formData.password);
          // Check if user is actually verified in Firebase Auth (sometimes there's a sync delay)
          if (user.emailVerified) {
            // User is verified in Firebase Auth, sync with Firestore and redirect to dashboard
            const { checkEmailVerification } = await import('@/lib/auth');
            await checkEmailVerification();
            router.push('/dashboard');
          } else {
            // User is truly not verified, redirect to verification page
            router.push('/verify-email');
          }
        } catch (unverifiedError: any) {
          console.error('Unverified login error:', unverifiedError);
          if (unverifiedError.code === 'auth/user-not-found') {
            setErrors({ email: 'No account found with this email address' });
          } else if (unverifiedError.code === 'auth/wrong-password') {
            setErrors({ password: 'Incorrect password' });
          } else if (unverifiedError.code === 'auth/invalid-email') {
            setErrors({ email: 'Invalid email address' });
          } else {
            setErrors({ general: 'Failed to sign in. Please try again.' });
          }
        }
      } else if (error.code === 'auth/user-not-found') {
        setErrors({ email: 'No account found with this email address' });
      } else if (error.code === 'auth/wrong-password') {
        setErrors({ password: 'Incorrect password' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Invalid email address' });
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many failed attempts. Please try again later.' });
      } else {
        setErrors({ general: 'Failed to sign in. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <img 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              className="w-32 h-32 mx-auto mb-3 object-contain"
            />
            <h1 className="text-xl font-bold text-[#333333] mb-2">Welcome Back</h1>
            <p className="text-[#333333]/70 text-sm">Sign in to your student portal</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-6">
            <img 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              className="w-40 h-40 mx-auto mb-3 object-contain"
            />
            <h2 className="text-2xl font-bold text-[#333333] mb-1">Welcome Back</h2>
            <p className="text-[#333333]/70">Sign in to your student portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success Message Display */}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

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
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm placeholder:text-gray-400 text-black ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-[#EDEDED] focus:border-[#780000]'
                } focus:outline-none`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#333333] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 rounded-lg border-2 transition-colors text-sm placeholder:text-gray-400 text-black ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#EDEDED] focus:border-[#780000]'
                  } focus:outline-none`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-[#333333]/60 text-sm`}></i>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#780000] hover:underline">
                Forgot your password?
              </Link>
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
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-[#333333]">
                Don't have an account?{` `} 
                <Link href="/signup" className="text-[#780000] hover:underline font-medium">
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
