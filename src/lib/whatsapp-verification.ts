// WhatsApp number verification service using MAYTAPI
import { APP_CONFIG } from '@/config/app.config';

interface WhatsAppVerificationResponse {
  success: boolean;
  exists: boolean;
  message: string;
  phoneNumber?: string;
}

export class WhatsAppVerificationService {
  private static readonly PRODUCT_ID = APP_CONFIG.EXTERNAL.MAYTAPI.PRODUCT_ID;
  private static readonly TOKEN = APP_CONFIG.EXTERNAL.MAYTAPI.TOKEN;
  private static readonly PHONE_ID = APP_CONFIG.EXTERNAL.MAYTAPI.PHONE_ID;
  private static readonly API_BASE_URL = APP_CONFIG.EXTERNAL.MAYTAPI.BASE_URL;

  /**
   * Verify if a phone number is registered on WhatsApp
   * @param phoneNumber - The phone number to verify (in international format)
   * @returns Promise<WhatsAppVerificationResponse>
   */
  static async verifyWhatsAppNumber(phoneNumber: string): Promise<WhatsAppVerificationResponse> {
    try {
      // Clean and format phone number
      const cleanNumber = this.formatPhoneNumber(phoneNumber);
      
      if (!cleanNumber) {
        return {
          success: false,
          exists: false,
          message: 'Invalid phone number format'
        };
      }

      // Remove + and format for MAYTAPI (they expect just digits)
      const phoneDigits = cleanNumber.replace(/\D/g, '');
      
      // Construct the correct endpoint based on your working code
      const url = `${this.API_BASE_URL}/${this.PRODUCT_ID}/${this.PHONE_ID}/checkNumberStatus`;
      
      // Use URLSearchParams for query parameters
      const params = new URLSearchParams({
        token: this.TOKEN,
        number: `${phoneDigits}@c.us`  // MAYTAPI expects this format
      });

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: unknown = await response.json();
      const apiResponse = data as { success?: boolean; result?: { canReceiveMessage?: boolean }; message?: string };

      // Based on your working code, check for success and canReceiveMessage
      if (apiResponse.success && apiResponse.result && apiResponse.result.canReceiveMessage) {
        return {
          success: true,
          exists: true,
          message: 'Phone number is registered on WhatsApp',
          phoneNumber: cleanNumber
        };
      } else if (apiResponse.success && apiResponse.result && !apiResponse.result.canReceiveMessage) {
        return {
          success: true,
          exists: false,
          message: 'This number is not registered on WhatsApp',
          phoneNumber: cleanNumber
        };
      } else {
        return {
          success: false,
          exists: false,
          message: apiResponse.message || 'Failed to verify phone number'
        };
      }
    } catch (error) {
      console.error('WhatsApp verification error:', error);
      return {
        success: false,
        exists: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Format phone number for API request
   * @param phoneNumber - Raw phone number input
   * @returns Formatted phone number or null if invalid
   */
  private static formatPhoneNumber(phoneNumber: string): string | null {
    if (!phoneNumber) return null;

    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Basic validation - should be at least 10 digits after country code
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return null;
    }

    return cleaned;
  }

  /**
   * Validate phone number format without API call
   * @param phoneNumber - Phone number to validate
   * @returns boolean indicating if format is valid
   */
  static isValidPhoneNumberFormat(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return formatted !== null;
  }
}

export default WhatsAppVerificationService;
