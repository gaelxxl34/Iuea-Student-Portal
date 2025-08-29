import { useEffect, useState } from "react";
import welcomeService from "../services/welcomeService";

/**
 * Hook to handle welcome message functionality
 * Automatically sends welcome email and WhatsApp messages on first login
 */
export const useWelcomeMessages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Send welcome messages for a user
   * @param {Object} userData - User data
   * @param {string} userData.id - User ID
   * @param {string} userData.email - User email
   * @param {string} userData.name - User full name
   * @param {string} userData.phoneNumber - User phone number (optional)
   * @param {boolean} userData.isFirstLogin - Whether this is first login
   */
  const sendWelcomeMessages = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const { id, email, name, phoneNumber, isFirstLogin = true } = userData;

      // Check if welcome messages should be sent
      const shouldSend = await welcomeService.shouldSendWelcomeMessages(id);

      if (!shouldSend && isFirstLogin) {
        // Silent operation - messages already sent
        setSuccess("Welcome messages already sent");
        return { success: true, message: "Welcome messages already sent" };
      }

      let results = {};

      // Send welcome email (always send this)
      if (email && name) {
        const emailResult = await welcomeService.sendWelcomeEmail({
          userEmail: email,
          userName: name,
          isFirstLogin,
        });
        results.email = emailResult;
      }

      // Send WhatsApp message if phone number is provided
      if (phoneNumber && name) {
        const whatsappResult = await welcomeService.sendWelcomeWhatsApp({
          phoneNumber,
          userName: name,
          isFirstLogin,
        });
        results.whatsapp = whatsappResult;
      }

      // Mark welcome messages as sent if at least one was successful
      const hasSuccessfulMessage = Object.values(results).some(
        (result) => result.success || (result.data && result.data.success)
      );

      if (hasSuccessfulMessage) {
        welcomeService.markWelcomeMessagesSent(id);
        setSuccess("Welcome messages sent successfully");
        // Silent operation - only log to console for debugging
        console.log("Welcome messages sent successfully", results);
      } else {
        setError("Failed to send welcome messages");
        console.error("All welcome messages failed", results);
      }

      return { success: hasSuccessfulMessage, results };
    } catch (error) {
      console.error("Error sending welcome messages:", error);
      setError(error.message || "Failed to send welcome messages");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Auto-send welcome messages on component mount for first-time users
   * @param {Object} userData - User data
   */
  const autoSendWelcomeMessages = async (userData) => {
    if (!userData || !userData.id) {
      return;
    }

    try {
      const shouldSend = await welcomeService.shouldSendWelcomeMessages(
        userData.id
      );

      if (shouldSend) {
        // Silent operation - send welcome messages in background
        await sendWelcomeMessages({ ...userData, isFirstLogin: true });
      }
    } catch (error) {
      console.error("Error in auto-send welcome messages:", error);
    }
  };

  /**
   * Reset welcome message status (for testing or re-sending)
   */
  const resetWelcomeStatus = (userId) => {
    if (userId) {
      welcomeService.resetWelcomeMessagesStatus(userId);
      setSuccess("Welcome message status reset");
      setError(null);
    }
  };

  return {
    sendWelcomeMessages,
    autoSendWelcomeMessages,
    resetWelcomeStatus,
    isLoading,
    error,
    success,
  };
};

/**
 * Hook specifically for handling first login welcome messages
 * Use this in your authentication flow or dashboard component
 */
export const useFirstLoginWelcome = (user) => {
  const { autoSendWelcomeMessages, isLoading, error, success } =
    useWelcomeMessages();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (user && !hasChecked) {
      autoSendWelcomeMessages(user);
      setHasChecked(true);
    }
  }, [user, hasChecked, autoSendWelcomeMessages]);

  return {
    isLoading,
    error,
    success,
    hasChecked,
  };
};
