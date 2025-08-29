/**
 * Welcome API Service for Student Portal
 * Handles sending welcome emails and WhatsApp messages to users
 */
import { auth } from "../lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.nyotafusionai.com";

class WelcomeApiService {
  /**
   * Get auth headers with Firebase ID token
   */
  async getAuthHeaders() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };
    } catch (error) {
      console.error("Error getting auth headers:", error);
      return {
        "Content-Type": "application/json",
        Authorization: "",
      };
    }
  }

  /**
   * Send welcome email to user
   * @param {Object} userData - User data
   * @param {string} userData.userEmail - User's email address
   * @param {string} userData.userName - User's full name
   * @param {boolean} userData.isFirstLogin - Whether this is first login (default: true)
   */
  async sendWelcomeEmail({ userEmail, userName, isFirstLogin = true }) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/welcome/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userEmail,
          userName,
          isFirstLogin,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        // If response is not JSON (like HTML error page), create a generic error
        data = {
          error: `Server responded with ${response.status}: ${response.statusText}`,
          details: "Response was not valid JSON",
        };
      }

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // Silent error logging - only to console
      console.error("Welcome email API error:", error);
      return {
        success: false,
        error: error.message || "Failed to send welcome email",
      };
    }
  }

  /**
   * Send welcome WhatsApp message to user
   * @param {Object} userData - User data
   * @param {string} userData.phoneNumber - User's phone number
   * @param {string} userData.userName - User's full name
   * @param {boolean} userData.isFirstLogin - Whether this is first login (default: true)
   */
  async sendWelcomeWhatsApp({ phoneNumber, userName, isFirstLogin = true }) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/welcome/whatsapp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phoneNumber,
          userName,
          isFirstLogin,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        // If response is not JSON (like HTML error page), create a generic error
        data = {
          error: `Server responded with ${response.status}: ${response.statusText}`,
          details: "Response was not valid JSON",
        };
      }

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // Silent error logging - only to console
      console.error("Welcome WhatsApp API error:", error);
      return {
        success: false,
        error: error.message || "Failed to send welcome WhatsApp message",
      };
    }
  }

  /**
   * Check if user should receive welcome messages (first login detection)
   * You can implement this based on your user tracking needs
   * @param {string} userId - User ID
   */
  async shouldSendWelcomeMessages(userId) {
    try {
      // Check localStorage for first login tracking
      const welcomeMessagesSent = localStorage.getItem(
        `welcome_sent_${userId}`
      );

      if (welcomeMessagesSent) {
        return false; // Already sent welcome messages
      }

      return true; // Should send welcome messages
    } catch (error) {
      console.error("Error checking welcome messages status:", error);
      return false; // Default to not sending if there's an error
    }
  }

  /**
   * Mark welcome messages as sent for a user
   * @param {string} userId - User ID
   */
  markWelcomeMessagesSent(userId) {
    try {
      localStorage.setItem(`welcome_sent_${userId}`, Date.now().toString());
      // Silent operation - only log for debugging
      console.log(`Welcome messages marked as sent for user ${userId}`);
    } catch (error) {
      console.error("Error marking welcome messages as sent:", error);
    }
  }

  /**
   * Reset welcome messages status (for testing or re-sending)
   * @param {string} userId - User ID
   */
  resetWelcomeMessagesStatus(userId) {
    try {
      localStorage.removeItem(`welcome_sent_${userId}`);
      console.log(`Welcome messages status reset for user ${userId}`);
    } catch (error) {
      console.error("Error resetting welcome messages status:", error);
    }
  }
}

const welcomeApiService = new WelcomeApiService();
export default welcomeApiService;
