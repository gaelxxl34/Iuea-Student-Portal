'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signInUnverified, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check for success messages from URL params
    const message = searchParams.get('message');
    const verified = searchParams.get('verified');
    if (message === 'password-reset-success') {
      setSuccessMessage('Password reset successful! You can now log in with your new password.');
    }
    if (verified === '1') {
      setSuccessMessage('Your email has been verified. You can now sign in.');
    }
  }, [searchParams]);

  // Show loading if still checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#780000]"></div>
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if user is authenticated
  if (user && user.emailVerified) {
    return null;
  }

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

  // Type guard for FirebaseError shape
  const getFirebaseErrorCode = (err: unknown): string | null => {
    if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
      return (err as { code: string }).code;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const emailInput = formData.email.trim();

    try {
      // Try to sign in the user directly - let Firebase handle the authentication
      await signInUnverified(emailInput, formData.password);
      
      // After successful authentication, check if email is verified
      const { checkEmailVerification } = await import('@/lib/auth');
      const isVerified = await checkEmailVerification();
      
      if (isVerified) {
        // User is verified, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not verified, redirect to verification page
        router.push('/verify-email');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);

      // Let Firebase determine the exact error - just handle the specific cases we know
      const code = getFirebaseErrorCode(error);
      
      // Handle specific Firebase error codes
      if (code === 'auth/user-not-found') {
        setErrors({ email: 'No account found with this email address' });
      } else if (code === 'auth/wrong-password') {
        setErrors({ password: 'Incorrect password. Please check your password and try again.' });
      } else if (code === 'auth/invalid-email') {
        setErrors({ email: 'Invalid email address' });
      } else if (code === 'auth/user-disabled') {
        setErrors({ general: 'This account has been disabled. Please contact support.' });
      } else if (code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many failed attempts. Please try again later.' });
      } else {
        // For any other error (including invalid-credential, invalid-login-credentials), 
        // show a generic message and log the actual error for debugging
        console.log('Unhandled auth error code:', code);
        console.log('Full error:', error);
        setErrors({ general: 'Login failed. Please check your email and password and try again.' });
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
            <h1 className="text-xl font-bold text-[#333333] mb-2">Welcome Back</h1>
            <p className="text-[#333333]/70 text-sm">Sign in to your application portal</p>
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
            <h2 className="text-2xl font-bold text-[#333333] mb-1">Welcome Back</h2>
            <p className="text-[#333333]/70">Sign in to your application portal</p>
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
                Don&apos;t have an account?{` `} 
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#780000]"></div>
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
