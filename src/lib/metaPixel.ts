/**
 * Meta Pixel Integration for Student Portal
 * Tracks signup and application events for conversion optimization
 * Uses the same standard mapping as nyota-ai-fusion-backend/src/services/metaConversionsApi.service.js
 */

// Meta Pixel ID - should be the same as your backend
const META_PIXEL_ID = '248693181482452';

// Window interface extension for fbq
declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: Window['fbq'];
  }
}

class MetaPixelService {
  private isInitialized = false;
  private debug = process.env.NODE_ENV === 'development';

  /**
   * Map application status to Meta event names (matches backend mapping)
   */
  private mapStatusToMetaEvent(status: string): string {
    const statusEventMap: { [key: string]: string } = {
      INTERESTED: 'Lead', // Standard event
      APPLIED: 'SubmitApplication', // Standard event - Application submitted
      IN_REVIEW: 'ApplicationInReview', // Custom event
      QUALIFIED: 'QualifiedLead', // Standard event - Qualified lead
      ADMITTED: 'Admitted', // Standard event - Student admitted
      ENROLLED: 'Purchase', // Standard event - ULTIMATE GOAL!
    };

    return statusEventMap[status] || 'Lead';
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
   * Initialize Meta Pixel if not already done
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Initialize Meta Pixel using a simpler approach
      if (!window.fbq) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        
        // Create fbq function
        window.fbq = function(...args: unknown[]) {
          if (!window.fbq) return;
          (window.fbq as { queue?: unknown[] }).queue = (window.fbq as { queue?: unknown[] }).queue || [];
          ((window.fbq as { queue: unknown[] }).queue as unknown[]).push(args);
        };
        
        // Set initial properties
        Object.assign(window.fbq, {
          loaded: true,
          version: '2.0',
          queue: []
        });

        document.head.appendChild(script);
      }

      // Initialize the pixel
      window.fbq?.('init', META_PIXEL_ID);
      window.fbq?.('track', 'PageView');

      this.isInitialized = true;
      
      if (this.debug) {
        console.log('🎯 Meta Pixel initialized with ID:', META_PIXEL_ID);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Meta Pixel:', error);
    }
  }

  /**
   * Hash data for privacy (simple client-side hashing)
   */
  private hashData(data: string): string {
    if (!data) return '';
    // Simple hash for client-side (in production, consider using crypto-js)
    return btoa(data.toLowerCase().trim());
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
      const eventName = this.mapStatusToMetaEvent(status);
      const conversionValue = this.calculateConversionValue(status);

      // Send standard Meta event (matches backend structure)
      window.fbq?.('track', eventName, {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD'
      });

      // Also track as custom event for additional insights
      window.fbq?.('trackCustom', 'StudentSignup', {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD',
        status: status,
        event_source: 'student_portal',
        lead_event_source: 'Nyota Student Portal'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Signup conversion tracked', {
          event: eventName,
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
      const eventName = this.mapStatusToMetaEvent(status);
      const conversionValue = this.calculateConversionValue(status);

      // Send standard Meta event (matches backend structure)
      window.fbq?.('track', eventName, {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD'
      });

      // Also track as custom event for additional insights
      window.fbq?.('trackCustom', 'ApplicationSubmitted', {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD',
        status: status,
        program: userData.program,
        event_source: 'student_portal',
        lead_event_source: 'Nyota Student Portal'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Application submission tracked', {
          event: eventName,
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
      const eventName = this.mapStatusToMetaEvent(status);
      const conversionValue = this.calculateConversionValue(status);

      // Send standard Meta event (matches backend structure)
      window.fbq?.('track', eventName, {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD'
      });

      // Also track as custom event for detailed insights
      window.fbq?.('trackCustom', `Status${status}`, {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD',
        status: status,
        program: userData.program,
        event_source: 'student_portal',
        lead_event_source: 'Nyota Student Portal',
        application_id: userData.applicationId || userData.leadId
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Status conversion tracked', {
          event: eventName,
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
      const eventName = this.mapStatusToMetaEvent(status); // This will be 'Purchase'
      const conversionValue = this.calculateConversionValue(status); // This will be 15

      // Send Purchase event (highest value conversion)
      window.fbq?.('track', eventName, {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD'
      });

      // Also track as custom event
      window.fbq?.('trackCustom', 'StudentEnrolled', {
        content_name: 'Student Application',
        content_category: 'Education',
        value: conversionValue,
        currency: 'USD',
        status: status,
        program: userData.program,
        event_source: 'student_portal',
        lead_event_source: 'Nyota Student Portal',
        application_id: userData.applicationId
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: ENROLLMENT conversion tracked - HIGHEST VALUE EVENT!', {
          event: eventName,
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
   * Track page views for specific pages (enhanced with consistent structure)
   */
  trackPageView(pageName: string) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      window.fbq?.('track', 'PageView');
      
      // Track custom page view for better insights (matches backend structure)
      window.fbq?.('trackCustom', 'PageView', {
        content_name: pageName,
        content_category: 'Education',
        page_type: 'student_portal',
        event_source: 'student_portal',
        lead_event_source: 'Nyota Student Portal'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Page view tracked', pageName);
      }
    } catch (error) {
      console.error('❌ Failed to track page view:', error);
    }
  }

  /**
   * Track form starts (when users begin filling forms) - enhanced mapping
   */
  trackFormStart(formType: 'signup' | 'application') {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      window.fbq?.('track', 'InitiateCheckout', {
        content_name: formType === 'signup' ? 'Student Signup Form' : 'Student Application Form',
        content_category: 'Education',
        event_source: 'student_portal',
        lead_event_source: 'Nyota Student Portal'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Form start tracked', formType);
      }
    } catch (error) {
      console.error('❌ Failed to track form start:', error);
    }
  }

  /**
   * Track email verification (enhanced with consistent structure)
   */
  trackEmailVerification(email: string) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      window.fbq?.('trackCustom', 'EmailVerified', {
        content_name: 'Email Verification Complete',
        content_category: 'Education',
        event_source: 'student_portal',
        lead_event_source: 'Nyota Student Portal'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Email verification tracked', email);
      }
    } catch (error) {
      console.error('❌ Failed to track email verification:', error);
    }
  }
}

// Export singleton instance
export const metaPixel = new MetaPixelService();

// Export for easier usage
export default metaPixel;
