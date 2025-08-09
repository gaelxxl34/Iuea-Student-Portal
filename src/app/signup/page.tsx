
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-number-input';
import WhatsAppVerificationService from '@/lib/whatsapp-verification';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsappNumber: '',
    password: ''
  });

  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [whatsappVerifying, setWhatsappVerifying] = useState(false);
  const [whatsappVerificationMessage, setWhatsappVerificationMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password)
    };
  };

  const passwordRules = validatePassword(formData.password);
  const passwordStrength = Object.values(passwordRules).filter(Boolean).length;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Reset WhatsApp verification when number changes
    if (field === 'whatsappNumber') {
      setWhatsappVerified(false);
      setWhatsappVerificationMessage('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = 'WhatsApp number is required';
    else if (!whatsappVerified) newErrors.whatsappNumber = 'Please verify your WhatsApp number';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (passwordStrength < 3) newErrors.password = 'Password must meet all requirements';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWhatsAppVerification = async () => {
    if (!formData.whatsappNumber.trim()) {
      setWhatsappVerificationMessage('Please enter a WhatsApp number first');
      return;
    }

    if (!WhatsAppVerificationService.isValidPhoneNumberFormat(formData.whatsappNumber)) {
      setWhatsappVerificationMessage('Please enter a valid phone number format');
      return;
    }

    setWhatsappVerifying(true);
    setWhatsappVerificationMessage('');

    try {
      const result = await WhatsAppVerificationService.verifyWhatsAppNumber(formData.whatsappNumber);
      
      if (result.success && result.exists) {
        setWhatsappVerified(true);
        setWhatsappVerificationMessage('WhatsApp number verified successfully!');
      } else if (result.success && !result.exists) {
        setWhatsappVerified(false);
        setWhatsappVerificationMessage('This number is not registered on WhatsApp. Please use a valid WhatsApp number.');
      } else {
        setWhatsappVerified(false);
        setWhatsappVerificationMessage(result.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setWhatsappVerified(false);
      setWhatsappVerificationMessage('Network error. Please check your connection and try again.');
      console.error('WhatsApp verification error:', error);
    } finally {
      setWhatsappVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!whatsappVerified) {
      setErrors(prev => ({ ...prev, whatsappNumber: 'Please verify your WhatsApp number first' }));
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.whatsappNumber
      );

      // Show email verification message
      setEmailSent(true);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'An account with this email already exists' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Password is too weak' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Invalid email address' });
      } else {
        setErrors({ general: 'Failed to create account. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show email verification message after successful signup
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-mail-send-line text-2xl text-green-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Check Your Email</h2>
          <p className="text-[#333333]/70 mb-6">
            We've sent a verification link to <strong>{formData.email}</strong>. 
            Please check your email and click the verification link to activate your account.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-[#333333]/60">
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                onClick={() => setEmailSent(false)}
                className="text-[#780000] hover:underline font-medium"
              >
                try again
              </button>
            </p>
            <Link 
              href="/login" 
              className="block w-full bg-[#780000] hover:bg-[#600000] text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
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

      {/* Right Form Panel - Scrollable on mobile, fixed on desktop */}
      <div className="flex-1 lg:w-2/5 flex flex-col justify-start lg:justify-center min-h-screen lg:h-screen bg-white p-6 lg:p-8 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-md mx-auto py-6 lg:py-0">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-6">
            <img 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              className="w-32 h-32 mx-auto mb-3 object-contain"
            />
            <h1 className="text-xl font-bold text-[#333333] mb-2">Welcome to IUEA</h1>
            <p className="text-[#333333]/70 text-sm">Create your student portal account</p>
          </div>

          {/* Desktop Header - Bigger Logo */}
          <div className="hidden lg:block text-center mb-6">
            <img 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              className="w-40 h-40 mx-auto mb-3 object-contain"
            />
            <h2 className="text-2xl font-bold text-[#333333] mb-1">Create Account</h2>
            <p className="text-[#333333]/70">Join the IUEA student community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* General Error Display */}
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#333333] mb-1">
                  First Name
                </label>
                  <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm placeholder:text-gray-400 text-black ${
                    errors.firstName 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#EDEDED] focus:border-[#780000]'
                  } focus:outline-none`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[#333333] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm placeholder:text-gray-400 text-black ${
                    errors.lastName 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#EDEDED] focus:border-[#780000]'
                  } focus:outline-none`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

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

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-[#333333] mb-1">
                WhatsApp Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="UG"
                    value={formData.whatsappNumber}
                    onChange={(value) => handleInputChange('whatsappNumber', value || '')}
                    className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm bg-white ${
                      errors.whatsappNumber 
                        ? 'border-red-500 focus-within:border-red-500' 
                        : 'border-[#EDEDED] focus-within:border-[#780000]'
                    }`}
                    placeholder="Enter phone number"
                    style={{
                      '--PhoneInputCountryFlag-height': '1.2em',
                      '--PhoneInputCountryFlag-width': '1.5em',
                      '--PhoneInputCountrySelectArrow-color': '#000000',
                      '--PhoneInputCountrySelectArrow-opacity': '0.8',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleWhatsAppVerification}
                  disabled={whatsappVerifying || !formData.whatsappNumber.trim() || whatsappVerified}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors whitespace-nowrap text-sm font-medium ${
                    whatsappVerified 
                      ? 'border-green-500 bg-green-500 text-white cursor-not-allowed'
                      : whatsappVerifying
                      ? 'border-gray-400 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'border-[#780000] text-[#780000] hover:bg-[#780000] hover:text-white cursor-pointer'
                  }`}
                >
                  {whatsappVerifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : whatsappVerified ? (
                    <div className="flex items-center gap-1">
                      <i className="ri-check-line"></i>
                      <span>Verified</span>
                    </div>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                {whatsappVerified && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-check-line text-green-600 text-sm"></i>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  </div>
                )}
                {whatsappVerificationMessage && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    whatsappVerified 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {whatsappVerificationMessage}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-[#333333]/60">
                We verify that your number is registered on WhatsApp before creating your account.
              </p>
              {errors.whatsappNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.whatsappNumber}</p>
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
                  placeholder="Create password"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!whatsappVerified || isSubmitting}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors whitespace-nowrap ${
                whatsappVerified && !isSubmitting
                  ? 'bg-[#780000] hover:bg-[#600000] text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!whatsappVerified ? 'Please verify your WhatsApp number first' : ''}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Trust Note */}
            <p className="text-xs text-[#333333]/50 text-center">
              IUEA is a fully chartered private university.
            </p>

            {/* Legal & Login Link */}
            <div className="space-y-2 text-center">
              <p className="text-xs text-[#333333]/60">
                By creating an account, you agree to the{` `} 
                <Link href="/terms" className="text-[#780000] hover:underline">
                  Terms
                </Link>
                {` `}and{` `} 
                <Link href="/privacy" className="text-[#780000] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="text-sm text-[#333333]">
                Already have an account?{` `} 
                <Link href="/login" className="text-[#780000] hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
