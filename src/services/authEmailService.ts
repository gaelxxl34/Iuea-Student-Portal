/**
 * Custom Authentication Email Service for Student Portal
 * Provides branded email templates for Firebase Auth operations
 * Replaces default Firebase emails with professionally designed ones
 */

import { auth } from "../lib/firebase";
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  ActionCodeSettings,
  User
} from 'firebase/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.nyotafusionai.com";

interface AuthEmailOptions {
  email: string;
  userName?: string;
  redirectUrl?: string;
  phoneNumber?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

class AuthEmailService {
  
  /**
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    let idToken = '';
    
    if (user) {
      try {
        idToken = await user.getIdToken();
      } catch (error) {
        console.warn('Could not get ID token:', error);
      }
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': idToken ? `Bearer ${idToken}` : '',
    };
  }

  /**
   * Send custom branded email verification
   * This replaces Firebase's default email verification
   * Also sends WhatsApp notification if phone number is provided
   */
  async sendCustomEmailVerification({ 
    email, 
    userName = "Student",
    redirectUrl = `${window.location.origin}/verify-email`,
    phoneNumber
  }: AuthEmailOptions): Promise<EmailResponse> {
    try {
      console.log('📧 Sending custom email verification to:', email);
      
      const headers = await this.getAuthHeaders();

      const requestBody: {
        email: string;
        userName: string;
        redirectUrl: string;
        portalType: string;
        phoneNumber?: string;
      } = {
        email,
        userName,
        redirectUrl,
        portalType: 'student'
      };

      // Add phone number if provided for WhatsApp notification
      if (phoneNumber) {
        requestBody.phoneNumber = phoneNumber;
        console.log('📱 Phone number provided, WhatsApp notification will be sent');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/send-email-verification`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { 
          error: `Server responded with ${response.status}: ${response.statusText}`,
          details: "Response was not valid JSON"
        };
      }

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Custom email verification sent successfully:', responseData);
      
      if (responseData.whatsappSent) {
        console.log('📱 WhatsApp notification sent successfully');
      }

      return {
        success: true,
        message: "Email verification sent successfully",
        messageId: responseData.messageId,
      };
    } catch (error) {
      console.error("❌ Custom email verification API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email verification",
        message: "Failed to send email verification",
      };
    }
  }

  /**
   * Send custom branded password reset email
   * This replaces Firebase's default password reset email
   */
  async sendCustomPasswordReset({ 
    email, 
    userName = "Student" 
  }: AuthEmailOptions): Promise<EmailResponse> {
    try {
      console.log('📧 Sending custom password reset to:', email);
      
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/auth/send-password-reset`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          userName,
          portalType: 'student',
          frontendUrl: window.location.origin
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { 
          error: `Server responded with ${response.status}: ${response.statusText}`,
          details: "Response was not valid JSON"
        };
      }

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Custom password reset sent successfully:', responseData);

      return {
        success: true,
        message: "Password reset email sent successfully",
        messageId: responseData.messageId,
      };
    } catch (error) {
      console.error("❌ Custom password reset API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send password reset email",
        message: "Failed to send password reset email",
      };
    }
  }

  /**
   * Send welcome email on first login
   * NOTE: This should NOT be called during signup - only on first login
   * to avoid sending duplicate welcome emails
   */
  async sendWelcomeEmail({ 
    email, 
    userName = "Student" 
  }: AuthEmailOptions): Promise<EmailResponse> {
    try {
      console.log('📧 Sending welcome email to:', email);
      
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/welcome/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userEmail: email,
          userName,
          isFirstLogin: true,
          portalType: 'student'
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { 
          error: `Server responded with ${response.status}: ${response.statusText}`,
          details: "Response was not valid JSON"
        };
      }

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Welcome email sent successfully:', responseData);

      return {
        success: true,
        message: "Welcome email sent successfully",
        messageId: responseData.messageId,
      };
    } catch (error) {
      console.error("❌ Welcome email API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send welcome email",
        message: "Failed to send welcome email",
      };
    }
  }

  /**
   * Send magic link for passwordless authentication
   * Uses Firebase's email link authentication with custom branding
   */
  async sendMagicLink({ 
    email, 
    redirectUrl = `${window.location.origin}/auth/signin` 
  }: AuthEmailOptions): Promise<EmailResponse> {
    try {
      console.log('🔗 Sending magic link to:', email);

      const actionCodeSettings: ActionCodeSettings = {
        url: redirectUrl,
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.iuea.studentportal'
        },
        android: {
          packageName: 'com.iuea.studentportal',
          installApp: true,
          minimumVersion: '12'
        },
        dynamicLinkDomain: 'iuea.page.link'
      };

      // Send magic link using Firebase
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Store email locally for the sign-in process
      window.localStorage.setItem('emailForSignIn', email);

      console.log('✅ Magic link sent successfully');

      return {
        success: true,
        message: "Magic link sent successfully",
      };
    } catch (error) {
      console.error("❌ Magic link error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send magic link",
        message: "Failed to send magic link",
      };
    }
  }

  /**
   * Complete magic link sign-in
   */
  async completeMagicLinkSignIn(url: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (isSignInWithEmailLink(auth, url)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }

        if (!email) {
          throw new Error('Email is required for sign-in');
        }

        const result = await signInWithEmailLink(auth, email, url);
        
        // Clear the email from storage
        window.localStorage.removeItem('emailForSignIn');
        
        console.log('✅ Magic link sign-in successful');
        
        return {
          success: true,
          user: result.user
        };
      } else {
        throw new Error('Invalid sign-in link');
      }
    } catch (error) {
      console.error("❌ Magic link sign-in error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete sign-in"
      };
    }
  }

  /**
   * Send account verification reminder
   */
  async sendVerificationReminder({ 
    email, 
    userName = "Student" 
  }: AuthEmailOptions): Promise<EmailResponse> {
    try {
      console.log('📧 Sending verification reminder to:', email);
      
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/auth/send-verification-reminder`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          userName,
          portalType: 'student'
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { 
          error: `Server responded with ${response.status}: ${response.statusText}`,
          details: "Response was not valid JSON"
        };
      }

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Verification reminder sent successfully:', responseData);

      return {
        success: true,
        message: "Verification reminder sent successfully",
        messageId: responseData.messageId,
      };
    } catch (error) {
      console.error("❌ Verification reminder API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send verification reminder",
        message: "Failed to send verification reminder",
      };
    }
  }
}

// Export singleton instance
const authEmailService = new AuthEmailService();
export default authEmailService;

// Export class for testing
export { AuthEmailService };
export type { AuthEmailOptions, EmailResponse };