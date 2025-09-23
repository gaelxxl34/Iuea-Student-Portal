'use client';

import { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-number-input';
import WhatsAppVerificationService from '@/lib/whatsapp-verification';
import { useAuth } from '@/contexts/AuthContext';
import { createAbsoluteUrl } from '@/config/app.config';
import metaPixel from '@/lib/metaPixel';
import { googleTagManager } from '@/lib/googleTagManager';

export default function EmbedSignUpPage() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsappNumber: '',
    password: ''
  });

  const [submittedBy, setSubmittedBy] = useState<string>('');

  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [whatsappVerifying, setWhatsappVerifying] = useState(false);
  const [whatsappVerificationMessage, setWhatsappVerificationMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Auto-resize iframe functionality
  useEffect(() => {
    // Extract submittedBy from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const submittedByParam = urlParams.get('submittedBy');
    if (submittedByParam) {
      setSubmittedBy(submittedByParam);
    }

    // Track page view for embed signup
    metaPixel.trackPageView('Embed Signup Page');

    // Listen for submittedBy data from parent window (alternative method)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'submittedBy') {
        setSubmittedBy(event.data.value);
      }
    };

    window.addEventListener('message', handleMessage);

    const resizeObserver = new ResizeObserver(() => {
      const height = document.body.scrollHeight;
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'resize',
          height: height
        }, '*');
      }
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Track when user starts filling the form
  useEffect(() => {
    const hasFormData = formData.firstName || formData.lastName || formData.email;
    if (hasFormData) {
      metaPixel.trackFormStart('signup');
    }
  }, [formData.firstName, formData.lastName, formData.email]);

  // Initial height notification
  useEffect(() => {
    const timer = setTimeout(() => {
      const height = document.body.scrollHeight;
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'resize',
          height: height
        }, '*');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [emailSent]);

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 6
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
    else if (passwordStrength < 1) newErrors.password = 'Password must be at least 6 characters long';

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
        setWhatsappVerificationMessage('');
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
        formData.whatsappNumber,
        submittedBy // Pass submittedBy to signUp function
      );

      // 🎯 TRACK SIGNUP CONVERSION TO META
      metaPixel.trackSignup({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.whatsappNumber
      });

      console.log('🎯 Meta Pixel: Embed signup conversion tracked for', formData.email);

      // 🎯 TRACK SIGNUP CONVERSION TO GOOGLE ADS
      googleTagManager.trackSignup({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.whatsappNumber
      });

      console.log('🎯 Google Tag Manager: Embed signup conversion tracked for', formData.email);

      // Show email verification message
      setEmailSent(true);
      
      // Notify parent window of successful signup for conversion tracking
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'signup_success',
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          submittedBy: submittedBy,
          timestamp: new Date().toISOString()
        }, '*');
      }
    } catch (error: unknown) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase auth errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('auth/email-already-in-use')) {
        setErrors({ email: 'An account with this email already exists' });
      } else if (errorMessage.includes('auth/weak-password')) {
        setErrors({ password: 'Password is too weak' });
      } else if (errorMessage.includes('auth/invalid-email')) {
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
      <div className="bg-white p-6 min-h-[400px] flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-mail-send-line text-2xl text-green-600"></i>
          </div>
          <h2 className="text-xl font-bold text-[#333333] mb-2">Check Your Email</h2>
          <p className="text-[#333333]/70 mb-6 text-sm">
            We&apos;ve sent a verification link to <strong>{formData.email}</strong>. 
            Please check your email and click the verification link to activate your account.
          </p>
          <div className="space-y-3">
            <p className="text-xs text-[#333333]/60">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button 
                onClick={() => setEmailSent(false)}
                className="text-[#780000] hover:underline font-medium"
              >
                try again
              </button>
            </p>
            <a 
              href={createAbsoluteUrl("/login")} 
              target="_parent"
              className="block w-full bg-[#780000] hover:bg-[#600000] text-white font-medium py-2 px-4 transition-colors text-sm"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 max-w-md mx-auto">
      {/* Compact Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#333333] mb-1">Apply to IUEA</h2>
        <p className="text-[#333333]/70 text-sm">Create your application account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error Display */}
        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm">
            {errors.general}
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-[#333333] mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className={`w-full px-3 py-2 border-2 transition-colors text-base placeholder:text-gray-400 text-black ${
                errors.firstName 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-[#EDEDED] focus:border-[#780000]'
              } focus:outline-none`}
              placeholder="First name"
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
              className={`w-full px-3 py-2 border-2 transition-colors text-base placeholder:text-gray-400 text-black ${
                errors.lastName 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-[#EDEDED] focus:border-[#780000]'
              } focus:outline-none`}
              placeholder="Last name"
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
            className={`w-full px-3 py-2 border-2 transition-colors text-base placeholder:text-gray-400 text-black ${
              errors.email 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-[#EDEDED] focus:border-[#780000]'
            } focus:outline-none`}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* WhatsApp Number */}
        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-[#333333] mb-1">
            WhatsApp Number
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="UG"
                value={formData.whatsappNumber}
                onChange={(value) => handleInputChange('whatsappNumber', value || '')}
                className={`w-full px-3 py-2 border-2 transition-colors text-base bg-white ${
                  errors.whatsappNumber 
                    ? 'border-red-500 focus-within:border-red-500' 
                    : 'border-[#EDEDED] focus-within:border-[#780000]'
                }`}
                placeholder="Phone number"
                style={{
                  '--PhoneInputCountryFlag-height': '1em',
                  '--PhoneInputCountryFlag-width': '1.3em',
                  '--PhoneInputCountrySelectArrow-color': '#000000',
                  '--PhoneInputCountrySelectArrow-opacity': '0.8',
                }}
                inputStyle={{
                  fontSize: '16px',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent'
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleWhatsAppVerification}
              disabled={whatsappVerifying || !formData.whatsappNumber.trim() || whatsappVerified}
              className={`px-3 py-2 border-2 transition-colors whitespace-nowrap text-base font-medium ${
                whatsappVerified 
                  ? 'border-green-500 bg-green-500 text-white cursor-not-allowed'
                  : whatsappVerifying
                  ? 'border-gray-400 bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'border-[#780000] text-[#780000] hover:bg-[#780000] hover:text-white cursor-pointer'
              }`}
            >
              {whatsappVerifying ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin"></div>
                  <span>Verifying</span>
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
          
          {whatsappVerified && (
            <div className="mt-1 flex items-center gap-1">
              <i className="ri-check-line text-green-600 text-xs"></i>
              <span className="text-xs text-green-700">WhatsApp verified</span>
            </div>
          )}
          
          {whatsappVerificationMessage && !whatsappVerified && (
            <p className="mt-1 text-xs text-red-600">{whatsappVerificationMessage}</p>
          )}
          
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
              className={`w-full px-3 py-2 pr-10 border-2 transition-colors text-base placeholder:text-gray-400 text-black ${
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
            <div className="mt-2">
              <div className={`flex items-center gap-1 text-xs ${passwordRules.length ? 'text-green-600' : 'text-[#333333]/60'}`}>
                <i className={`ri-${passwordRules.length ? 'check' : 'close'}-line text-xs`}></i>
                <span>At least 6 characters</span>
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
          className={`w-full font-medium py-3 px-4 transition-colors text-sm ${
            whatsappVerified && !isSubmitting
              ? 'bg-[#780000] hover:bg-[#600000] text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!whatsappVerified ? 'Please verify your WhatsApp number first' : ''}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin"></div>
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>

        {/* Legal Notice */}
        <p className="text-xs text-[#333333]/60 text-center">
          By creating an account, you agree to our{' '}
          <a href={createAbsoluteUrl("/terms")} target="_parent" className="text-[#780000] hover:underline">Terms</a>
          {' '}and{' '}
          <a href={createAbsoluteUrl("/privacy")} target="_parent" className="text-[#780000] hover:underline">Privacy Policy</a>.
        </p>

        {/* Login Link */}
        <p className="text-xs text-[#333333] text-center">
          Already have an account?{' '}
          <a href={createAbsoluteUrl("/login")} target="_parent" className="text-[#780000] hover:underline font-medium">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
