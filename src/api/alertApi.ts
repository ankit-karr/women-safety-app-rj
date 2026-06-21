// Imports SOS alert message type.
import { SosAlertMessage } from '../types/contact.types';

// Function to fetch SOS alert details from backend using alert code.
export const getSosAlertDetailsApi = async (
  // Backend server/laptop IP address.
  serverIp: string,

  // Unique SOS alert code used to find alert details.
  alertCode: string,
): Promise<SosAlertMessage> => {
  // Calls backend API to get SOS alert details by alert code.
  const response = await fetch(
    `http://${serverIp}:8000/api/sos-alerts/${alertCode}`,
  );

  // Converts backend response body into JSON.
  const result = await response.json();

  // Checks if HTTP response failed or backend returned success false.
  if (!response.ok || !result.success) {
    // Throws readable error message from backend, or fallback error message.
    throw new Error(result.message || 'Alert details fetch failed');
  }

  // Returns SOS alert details data from backend response.
  return result.data;
};
