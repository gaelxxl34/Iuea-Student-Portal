/**
 * Google Tag Manager Integration for Student Portal
 * Tracks signup and application events for Google Ads conversion optimization
 * Uses the same standard mapping as googleAdsConversionsApi.service.js
 */

// Google Tag Manager Container ID - should match your backend configuration
const GTM_CONTAINER_ID = 'GTM-P6XCP2Z';

// Window interface extension for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

class GoogleTagManagerService {
  private isInitialized = false;
  private debug = process.env.NODE_ENV === 'development';

  /**
   * Map application status to Google Ads conversion actions (matches backend mapping)
   */
  private mapStatusToGoogleConversion(status: string): { action: string; value: number } {
    const statusConversionMap: { [key: string]: { action: string; value: number } } = {
      INTERESTED: { action: 'signup', value: 1 },
      APPLIED: { action: 'submit_application', value: 3 },
      IN_REVIEW: { action: 'application_review', value: 2 },
      QUALIFIED: { action: 'qualified_lead', value: 5 },
      ADMITTED: { action: 'student_admitted', value: 10 },
      ENROLLED: { action: 'student_enrolled', value: 15 }, // Highest value
    };

    return statusConversionMap[status] || statusConversionMap.INTERESTED;
  }

  /**
   * Calculate conversion value based on status (matches backend mapping)
   */
  private calculateConversionValue(status: string): number {
    const valueMap: { [key: string]: number } = {
      INTERESTED: 1,
      APPLIED: 3,
      IN_REVIEW: 2,
      QUALIFIED: 5,
      ADMITTED: 10,
      ENROLLED: 15, // Highest value for enrolled students
    };

    return valueMap[status] || 0;
  }

  /**
   * Initialize Google Tag Manager if not already done
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Initialize dataLayer if it doesn't exist
      if (!window.dataLayer) {
        window.dataLayer = [];
      }

      // Initialize gtag function
      if (!window.gtag) {
        window.gtag = function(...args: unknown[]) {
          if (!window.dataLayer) return;
          window.dataLayer.push(args);
        };
      }

      this.isInitialized = true;
      
      if (this.debug) {
        console.log('🔍 Google Tag Manager initialized with container:', GTM_CONTAINER_ID);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Tag Manager:', error);
    }
  }

  /**
   * Track signup conversion (INTERESTED status) - matches backend mapping
   */
  trackSignup(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      const status = 'INTERESTED';
      const conversionConfig = this.mapStatusToGoogleConversion(status);
      const conversionValue = this.calculateConversionValue(status);

      // Send Google Ads conversion event (you'll configure the conversion action in GTM)
      window.gtag?.('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Will be configured in GTM
        value: conversionValue,
        currency: 'USD',
        transaction_id: `signup_${Date.now()}`,
        custom_parameters: {
          event_source: 'student_portal',
          lead_event_source: 'Nyota Student Portal',
          status: status,
          conversion_type: 'signup'
        }
      });

      // Also send enhanced ecommerce event for better tracking
      window.gtag?.('event', 'sign_up', {
        method: 'email',
        custom_parameters: {
          content_name: 'Student Application',
          content_category: 'Education',
          value: conversionValue,
          currency: 'USD',
          status: status,
          event_source: 'student_portal',
          lead_event_source: 'Nyota Student Portal'
        }
      });

      // Push custom event to dataLayer for GTM triggers
      window.dataLayer?.push({
        event: 'nyota_signup',
        eventCategory: 'Lead Generation',
        eventAction: 'Signup',
        eventLabel: 'Student Registration',
        conversionValue: conversionValue,
        userId: userData.email,
        userStatus: status,
        customParameters: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          timestamp: new Date().toISOString()
        }
      });

      if (this.debug) {
        console.log('🔍 Google Tag Manager: Signup conversion tracked', {
          action: conversionConfig.action,
          value: conversionValue,
          status: status,
          user: userData.email
        });
      }
    } catch (error) {
      console.error('❌ Failed to track signup conversion:', error);
    }
  }

  /**
   * Track application submission (APPLIED status) - matches backend mapping
   */
  trackApplicationSubmission(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    program?: string;
  }) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      const status = 'APPLIED';
      const conversionConfig = this.mapStatusToGoogleConversion(status);
      const conversionValue = this.calculateConversionValue(status);

      // Send Google Ads conversion event (configured in GTM)
      window.gtag?.('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Will be configured in GTM
        value: conversionValue,
        currency: 'USD',
        transaction_id: `application_${Date.now()}`,
        custom_parameters: {
          event_source: 'student_portal',
          lead_event_source: 'Nyota Student Portal',
          status: status,
          program: userData.program,
          conversion_type: 'application'
        }
      });

      // Send enhanced ecommerce event
      window.gtag?.('event', 'begin_checkout', {
        currency: 'USD',
        value: conversionValue,
        items: [{
          item_id: 'student_application',
          item_name: 'Student Application',
          item_category: 'Education',
          item_variant: userData.program,
          quantity: 1,
          price: conversionValue
        }]
      });

      // Push custom event to dataLayer
      window.dataLayer?.push({
        event: 'nyota_application',
        eventCategory: 'Lead Generation',
        eventAction: 'Application Submission',
        eventLabel: userData.program || 'Student Application',
        conversionValue: conversionValue,
        userId: userData.email,
        userStatus: status,
        customParameters: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          program: userData.program,
          timestamp: new Date().toISOString()
        }
      });

      if (this.debug) {
        console.log('🔍 Google Tag Manager: Application submission tracked', {
          action: conversionConfig.action,
          value: conversionValue,
          status: status,
          user: userData.email,
          program: userData.program
        });
      }
    } catch (error) {
      console.error('❌ Failed to track application submission:', error);
    }
  }

  /**
   * Generic method to track any status conversion (matches backend structure)
   */
  trackStatusConversion(
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
  ) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      const conversionConfig = this.mapStatusToGoogleConversion(status);
      const conversionValue = this.calculateConversionValue(status);

      // Send Google Ads conversion event (configured in GTM)
      window.gtag?.('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Will be configured in GTM based on status
        value: conversionValue,
        currency: 'USD',
        transaction_id: userData.applicationId || userData.leadId || `${status.toLowerCase()}_${Date.now()}`,
        custom_parameters: {
          event_source: 'student_portal',
          lead_event_source: 'Nyota Student Portal',
          status: status,
          program: userData.program,
          conversion_type: status.toLowerCase(),
          application_id: userData.applicationId || userData.leadId
        }
      });

      // Push custom event to dataLayer
      window.dataLayer?.push({
        event: `nyota_${status.toLowerCase()}`,
        eventCategory: 'Lead Generation',
        eventAction: `Status Change - ${status}`,
        eventLabel: userData.program || 'Student Application',
        conversionValue: conversionValue,
        userId: userData.email,
        userStatus: status,
        customParameters: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          program: userData.program,
          leadId: userData.leadId,
          applicationId: userData.applicationId,
          timestamp: new Date().toISOString()
        }
      });

      if (this.debug) {
        console.log('🔍 Google Tag Manager: Status conversion tracked', {
          action: conversionConfig.action,
          value: conversionValue,
          status: status,
          user: userData.email,
          program: userData.program
        });
      }
    } catch (error) {
      console.error('❌ Failed to track status conversion:', error);
    }
  }

  /**
   * Track enrollment conversion (ENROLLED status - highest value event)
   */
  trackEnrollmentConversion(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    program?: string;
    applicationId?: string;
  }) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      const status = 'ENROLLED';
      const conversionConfig = this.mapStatusToGoogleConversion(status);
      const conversionValue = this.calculateConversionValue(status);

      // Send Google Ads conversion event - highest value conversion (configured in GTM)
      window.gtag?.('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/ENROLLMENT_LABEL', // Will be configured in GTM
        value: conversionValue,
        currency: 'USD',
        transaction_id: userData.applicationId || `enrollment_${Date.now()}`,
        custom_parameters: {
          event_source: 'student_portal',
          lead_event_source: 'Nyota Student Portal',
          status: status,
          program: userData.program,
          conversion_type: 'enrollment',
          application_id: userData.applicationId
        }
      });

      // Send purchase event for ecommerce tracking
      window.gtag?.('event', 'purchase', {
        transaction_id: userData.applicationId || `enrollment_${Date.now()}`,
        value: conversionValue,
        currency: 'USD',
        items: [{
          item_id: 'student_enrollment',
          item_name: 'Student Enrollment',
          item_category: 'Education',
          item_variant: userData.program,
          quantity: 1,
          price: conversionValue
        }]
      });

      // Push custom event to dataLayer
      window.dataLayer?.push({
        event: 'nyota_enrollment',
        eventCategory: 'Lead Generation',
        eventAction: 'Student Enrolled',
        eventLabel: userData.program || 'Student Enrollment',
        conversionValue: conversionValue,
        userId: userData.email,
        userStatus: status,
        customParameters: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          program: userData.program,
          applicationId: userData.applicationId,
          timestamp: new Date().toISOString()
        }
      });

      if (this.debug) {
        console.log('🔍 Google Tag Manager: ENROLLMENT conversion tracked - HIGHEST VALUE EVENT!', {
          action: conversionConfig.action,
          value: conversionValue,
          status: status,
          user: userData.email,
          program: userData.program
        });
      }
    } catch (error) {
      console.error('❌ Failed to track enrollment conversion:', error);
    }
  }

  /**
   * Track form starts (when users begin filling forms) - enhanced tracking
   */
  trackFormStart(formType: 'signup' | 'application') {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      // Send Google Analytics event
      window.gtag?.('event', 'form_start', {
        form_type: formType,
        custom_parameters: {
          content_name: formType === 'signup' ? 'Student Signup Form' : 'Student Application Form',
          content_category: 'Education',
          event_source: 'student_portal',
          lead_event_source: 'Nyota Student Portal'
        }
      });

      // Push to dataLayer
      window.dataLayer?.push({
        event: 'nyota_form_start',
        eventCategory: 'Form Interaction',
        eventAction: 'Form Start',
        eventLabel: formType === 'signup' ? 'Signup Form' : 'Application Form',
        customParameters: {
          formType: formType,
          timestamp: new Date().toISOString()
        }
      });

      if (this.debug) {
        console.log('🔍 Google Tag Manager: Form start tracked', formType);
      }
    } catch (error) {
      console.error('❌ Failed to track form start:', error);
    }
  }

  /**
   * Track page views for specific pages (enhanced with consistent structure)
   */
  trackPageView(pageName: string) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      // Send page view event
      window.gtag?.('event', 'page_view', {
        page_title: pageName,
        custom_parameters: {
          content_name: pageName,
          content_category: 'Education',
          page_type: 'student_portal',
          event_source: 'student_portal',
          lead_event_source: 'Nyota Student Portal'
        }
      });

      // Push to dataLayer
      window.dataLayer?.push({
        event: 'nyota_page_view',
        eventCategory: 'Page Interaction',
        eventAction: 'Page View',
        eventLabel: pageName,
        customParameters: {
          pageName: pageName,
          timestamp: new Date().toISOString()
        }
      });

      if (this.debug) {
        console.log('🔍 Google Tag Manager: Page view tracked', pageName);
      }
    } catch (error) {
      console.error('❌ Failed to track page view:', error);
    }
  }
}

// Export singleton instance
export const googleTagManager = new GoogleTagManagerService();

// Export for easier usage
export default googleTagManager;