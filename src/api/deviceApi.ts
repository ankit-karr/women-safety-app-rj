// Defines input type required to register a device.
type RegisterDeviceInput = {
  // Backend server/laptop IP address.
  serverIp: string;

  // User name linked with this device.
  name: string;

  // Optional user phone number.
  phone?: string;

  // Unique device UUID used to identify this mobile device.
  deviceUuid: string;

  // Device name, like Android phone name or configured device name.
  deviceName: string;

  // Optional device type to tell backend whether this device sends SOS, receives SOS, or both.
  deviceType?: 'ANDROID_SENDER' | 'ANDROID_RECEIVER' | 'ANDROID_BOTH';

  // Optional Firebase Cloud Messaging token for push notifications.
  fcmToken?: string;
};

// Function to register device in backend database.
export const registerDeviceApi = async (input: RegisterDeviceInput) => {
  // Creates FormData because backend expects form-data request body.
  const formData = new FormData();

  // Adds user name to form data.
  formData.append('name', input.name);

  // Adds phone number, or empty string if phone is not provided.
  formData.append('phone', input.phone ?? '');

  // Adds unique device UUID to form data.
  formData.append('device_uuid', input.deviceUuid);

  // Adds device name to form data.
  formData.append('device_name', input.deviceName);

  // Adds device type, or ANDROID_BOTH as default.
  formData.append('device_type', input.deviceType ?? 'ANDROID_BOTH');

  // Adds FCM token, or empty string if token is not provided.
  formData.append('fcm_token', input.fcmToken ?? '');

  // Sends POST request to backend device registration API.
  const response = await fetch(
    `http://${input.serverIp}:8000/api/devices/register`,
    {
      method: 'POST',
      body: formData,
    },
  );

  // Converts backend response body into JSON.
  const result = await response.json();

  // Checks if HTTP response failed or backend returned success false.
  if (!response.ok || !result.success) {
    // Throws backend error message or fallback message.
    throw new Error(result.message || 'Device registration failed');
  }

  // Returns full backend response.
  return result;
};
