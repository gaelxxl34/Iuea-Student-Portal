/**
 * Google Tag Manager Integration Examples
 * 
 * This file shows how to add Google Tag Manager conversion tracking
 * to your existing pages alongside your Meta Pixel tracking.
 */

import { googleTagManager } from '@/lib/googleTagManager';
import metaPixel from '@/lib/metaPixel';

// ========================
// 1. SIGNUP CONVERSION TRACKING
// ========================

// Add this to your signup success handler (already done in embed/signup/page.tsx)
export const trackSignupConversion = (userData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) => {
  // Track to Meta (existing)
  metaPixel.trackSignup(userData);
  
  // Track to Google Ads (new)
  googleTagManager.trackSignup(userData);
  
  console.log('🎯 Conversion tracked to both Meta and Google Ads:', userData.email);
};

// ========================
// 2. APPLICATION SUBMISSION TRACKING
// ========================

// Add this when students submit their full application
export const trackApplicationSubmission = (userData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  program?: string;
}) => {
  // Track to Meta (if you have this)
  metaPixel.trackApplicationSubmission(userData);
  
  // Track to Google Ads (new)
  googleTagManager.trackApplicationSubmission(userData);
  
  console.log('🎯 Application submission tracked:', userData.email, userData.program);
};

// ========================
// 3. ENROLLMENT TRACKING (HIGHEST VALUE)
// ========================

// Add this when a student actually enrolls (becomes a paying student)
export const trackEnrollmentConversion = (userData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  program?: string;
  applicationId?: string;
}) => {
  // Track to Meta (if you have this)
  metaPixel.trackEnrollmentConversion(userData);
  
  // Track to Google Ads (new - highest value conversion)
  googleTagManager.trackEnrollmentConversion(userData);
  
  console.log('🎯 ENROLLMENT tracked - highest value conversion!', userData.email);
};

// ========================
// 4. GENERIC STATUS TRACKING
// ========================

// For any status changes in your CRM/lead management system
export const trackStatusConversion = (
  status: 'INTERESTED' | 'APPLIED' | 'IN_REVIEW' | 'QUALIFIED' | 'ADMITTED' | 'ENROLLED',
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    program?: string;
    leadId?: string;
    applicationId?: string;
  }
) => {
  // Track to Meta (if you have this)
  metaPixel.trackStatusConversion(status, userData);
  
  // Track to Google Ads (new)
  googleTagManager.trackStatusConversion(status, userData);
  
  console.log(`🎯 Status conversion tracked: ${status}`, userData.email);
};

// ========================
// 5. FORM START TRACKING
// ========================

// Track when users start filling out forms (good for optimization)
export const trackFormStart = (formType: 'signup' | 'application') => {
  // Track to Meta
  metaPixel.trackFormStart(formType);
  
  // Track to Google Ads
  googleTagManager.trackFormStart(formType);
  
  console.log('🎯 Form start tracked:', formType);
};

// ========================
// 6. PAGE VIEW TRACKING
// ========================

// Track important page views
export const trackPageView = (pageName: string) => {
  // Track to Meta
  metaPixel.trackPageView(pageName);
  
  // Track to Google Ads
  googleTagManager.trackPageView(pageName);
  
  console.log('🎯 Page view tracked:', pageName);
};

// ========================
// USAGE EXAMPLES
// ========================

/*

// Example 1: In a signup form component
const handleSignupSuccess = async (formData) => {
  try {
    await signUp(formData.email, formData.password, ...);
    
    // Track the conversion
    trackSignupConversion({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone
    });
    
  } catch (error) {
    console.error('Signup failed:', error);
  }
};

// Example 2: In an application form component  
const handleApplicationSubmit = async (applicationData) => {
  try {
    await submitApplication(applicationData);
    
    // Track the conversion
    trackApplicationSubmission({
      email: applicationData.email,
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      phone: applicationData.phone,
      program: applicationData.program
    });
    
  } catch (error) {
    console.error('Application failed:', error);
  }
};

// Example 3: In your CRM/admin when updating lead status
const updateLeadStatus = async (leadId, newStatus, leadData) => {
  try {
    await updateLeadInDatabase(leadId, newStatus);
    
    // Track the status change
    trackStatusConversion(newStatus, {
      email: leadData.email,
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      phone: leadData.phone,
      program: leadData.program,
      leadId: leadId
    });
    
  } catch (error) {
    console.error('Status update failed:', error);
  }
};

// Example 4: Track form starts for optimization
const handleFormFocus = () => {
  trackFormStart('signup'); // or 'application'
};

// Example 5: Track important page visits
useEffect(() => {
  trackPageView('Student Application Portal');
}, []);

*/