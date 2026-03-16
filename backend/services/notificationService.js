/**
 * Notification Abstraction Layer
 * In a real application, this would interface with SendGrid, Slack APIs, Twilio, etc.
 */
export const sendNotification = async (type, recipient, message) => {
  console.log(`\n--- [NOTIFICATION SYSTEM] ---`);
  console.log(`Type: ${type}`);
  console.log(`To: ${recipient}`);
  console.log(`Message: ${message}`);
  console.log(`-----------------------------\n`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return true;
};
