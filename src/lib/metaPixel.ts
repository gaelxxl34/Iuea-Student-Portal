/**
 * Meta Pixel Integration for Student Portal
 * Tracks signup and application events for conversion optimization
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
   * Track signup conversion (INTERESTED status)
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
      // Send via Facebook Pixel
      window.fbq?.('track', 'Lead', {
        content_name: 'Student Signup',
        content_category: 'Education',
        value: 1,
        currency: 'USD'
      });

      // Also track as custom event for better tracking
      window.fbq?.('trackCustom', 'StudentSignup', {
        content_name: 'IUEA Student Account Created',
        value: 1,
        currency: 'USD',
        status: 'INTERESTED'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Signup conversion tracked', {
          event: 'Lead',
          value: 1,
          user: userData.email
        });
      }
    } catch (error) {
      console.error('❌ Failed to track signup conversion:', error);
    }
  }

  /**
   * Track application submission (APPLIED status)
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
      // Send via Facebook Pixel
      window.fbq?.('track', 'SubmitApplication', {
        content_name: 'Student Application',
        content_category: 'Education',
        value: 3, // $3 for APPLIED status
        currency: 'USD'
      });

      // Also track as custom event
      window.fbq?.('trackCustom', 'ApplicationSubmitted', {
        content_name: `IUEA Application - ${userData.program || 'Unknown Program'}`,
        value: 3,
        currency: 'USD',
        status: 'APPLIED',
        program: userData.program
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Application submission tracked', {
          event: 'SubmitApplication',
          value: 3,
          user: userData.email,
          program: userData.program
        });
      }
    } catch (error) {
      console.error('❌ Failed to track application submission:', error);
    }
  }

  /**
   * Track page views for specific pages
   */
  trackPageView(pageName: string) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      window.fbq?.('track', 'PageView');
      
      // Track custom page view for better insights
      window.fbq?.('trackCustom', 'PageView', {
        content_name: pageName,
        page_type: 'student_portal'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Page view tracked', pageName);
      }
    } catch (error) {
      console.error('❌ Failed to track page view:', error);
    }
  }

  /**
   * Track form starts (when users begin filling forms)
   */
  trackFormStart(formType: 'signup' | 'application') {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      window.fbq?.('track', 'InitiateCheckout', {
        content_name: formType === 'signup' ? 'Signup Form' : 'Application Form',
        content_category: 'Education'
      });

      if (this.debug) {
        console.log('🎯 Meta Pixel: Form start tracked', formType);
      }
    } catch (error) {
      console.error('❌ Failed to track form start:', error);
    }
  }

  /**
   * Track email verification
   */
  trackEmailVerification(email: string) {
    if (typeof window === 'undefined') return;

    this.init();

    try {
      window.fbq?.('trackCustom', 'EmailVerified', {
        content_name: 'Email Verification Complete',
        content_category: 'Education'
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
