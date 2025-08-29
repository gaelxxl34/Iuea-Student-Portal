import React from "react";
import { useFirstLoginWelcome } from "../hooks/useWelcomeMessages";

/**
 * Silent welcome message handler component
 * Sends welcome messages in the background without showing UI notifications
 * Place this in your main dashboard or layout component
 */
const WelcomeMessageHandler = ({ user }) => {
  const { isLoading, error, success, hasChecked } = useFirstLoginWelcome(user);

  // Don't render anything - this component works silently in the background
  // All welcome messages are sent automatically without user notification
  return null;
};

export default WelcomeMessageHandler;
