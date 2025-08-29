/**
 * Application Notification Service for Student Portal
 * Handles sending email and WhatsApp notifications when applications are submitted
 */
import { auth } from "../lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.nyotafusionai.com/";

interface ApplicationNotificationData {
  applicationId: string;
  phoneNumber: string;
  email: string;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

class ApplicationNotificationService {
  /**
   * Get auth headers with Firebase ID token
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
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
   * Send application submission notifications (both email and WhatsApp)
   * @param {ApplicationNotificationData} data - Application notification data
   */
  async sendApplicationSubmissionNotifications(
    data: ApplicationNotificationData
  ): Promise<NotificationResponse> {
    try {
      console.log('📧 Sending application submission notifications...', data);
      
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/applications/notify-application-submitted`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          applicationId: data.applicationId,
          phoneNumber: data.phoneNumber,
          email: data.email,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send application notifications");
      }

      console.log('✅ Application notifications sent successfully:', responseData);

      return {
        success: true,
        message: "Application notifications sent successfully",
        data: responseData,
      };
    } catch (error) {
      console.error("❌ Application notification API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send application notifications",
        message: "Failed to send application notifications",
      };
    }
  }

  /**
   * Send application submission email only
   * @param {ApplicationNotificationData} data - Application notification data
   */
  async sendApplicationEmail(
    data: ApplicationNotificationData
  ): Promise<NotificationResponse> {
    try {
      console.log('📧 Sending application submission email...', data);
      
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/applications/send-application-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          applicationId: data.applicationId,
          email: data.email,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send application email");
      }

      console.log('✅ Application email sent successfully:', responseData);

      return {
        success: true,
        message: "Application email sent successfully",
        data: responseData,
      };
    } catch (error) {
      console.error("❌ Application email API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send application email",
        message: "Failed to send application email",
      };
    }
  }

  /**
   * Send application submission WhatsApp message only
   * @param {ApplicationNotificationData} data - Application notification data
   */
  async sendApplicationWhatsApp(
    data: ApplicationNotificationData
  ): Promise<NotificationResponse> {
    try {
      console.log('📱 Sending application submission WhatsApp message...', data);
      
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/applications/send-application-whatsapp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          applicationId: data.applicationId,
          phoneNumber: data.phoneNumber,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send application WhatsApp message");
      }

      console.log('✅ Application WhatsApp message sent successfully:', responseData);

      return {
        success: true,
        message: "Application WhatsApp message sent successfully",
        data: responseData,
      };
    } catch (error) {
      console.error("❌ Application WhatsApp API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send application WhatsApp message",
        message: "Failed to send application WhatsApp message",
      };
    }
  }
}

const applicationNotificationService = new ApplicationNotificationService();
export default applicationNotificationService;
