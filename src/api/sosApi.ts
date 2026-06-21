// Imports DangerImage type for captured emergency photos.
// Imports SmsLog type for SMS sending log details.
import { DangerImage, SmsLog } from '../types/contact.types';

// Imports EmergencyAudioFile type for captured SOS voice recording.
import { EmergencyAudioFile } from '../services/audioRecorderService';

// Defines input type required to send SOS data to backend.
type SendSosInput = {
  // Backend server/laptop IP address.
  serverIp: string;

  // Unique device UUID linked with this SOS alert.
  deviceUuid: string;

  // User name who is sending SOS.
  userName: string;

  // Current latitude as string.
  latitude: string;

  // Current longitude as string.
  longitude: string;

  // SMS status value like PENDING, SENT, FAILED, etc.
  smsStatus: string;

  // Total number of SMS successfully sent.
  smsSentCount: number;

  // Total number of SMS failed.
  smsFailedCount: number;

  // SMS log list for each contact.
  smsLogs: SmsLog[];

  // Optional captured emergency images.
  images?: DangerImage[];

  // Optional captured emergency audio.
  audio?: EmergencyAudioFile | null;

  // Optional SOS trigger source.
  triggeredBy?: 'SOS_BUTTON' | 'SHAKE_DETECTION';
};

// Function to send SOS alert data to backend.
export const sendSosToBackend = async (input: SendSosInput) => {
  // Creates FormData because backend receives normal fields plus image/audio files.
  const formData = new FormData();

  // Adds device UUID to form data.
  formData.append('device_uuid', input.deviceUuid);

  // Adds user name to form data.
  formData.append('user_name', input.userName);

  // Adds latitude to form data.
  formData.append('latitude', input.latitude);

  // Adds longitude to form data.
  formData.append('longitude', input.longitude);

  // Adds trigger type, or uses SOS_BUTTON as default.
  formData.append('triggered_by', input.triggeredBy ?? 'SOS_BUTTON');

  // Adds SMS status to form data.
  formData.append('sms_status', input.smsStatus);

  // Adds sent SMS count as string.
  formData.append('sms_sent_count', String(input.smsSentCount));

  // Adds failed SMS count as string.
  formData.append('sms_failed_count', String(input.smsFailedCount));

  // Converts SMS logs array into JSON string and adds it to form data.
  formData.append('sms_logs_json', JSON.stringify(input.smsLogs));

  // Converts image camera types into JSON string and adds it to form data.
  formData.append(
    'camera_types_json',
    JSON.stringify(input.images?.map(item => item.cameraType) ?? []),
  );

  // Checks if there are any captured images.
  if (input.images?.length) {
    // Loops through each captured image and appends it to form data.
    input.images.forEach((image, index) => {
      // Adds one image file to form data.
      formData.append('images', {
        // Ensures image path has file:// prefix required by React Native upload.
        uri: image.path.startsWith('file://')
          ? image.path
          : `file://${image.path}`,

        // Sets uploaded file mime type.
        type: 'image/jpeg',

        // Creates unique image file name.
        name: `danger-${Date.now()}-${index + 1}.jpg`,
      } as any);
    });
  }

  // Checks if voice/audio was captured successfully.
  if (input.audio) {
    // Adds audio file to form data.
    formData.append('audio', {
      // Sends audio URI to backend.
      uri: input.audio.uri,

      // Sends audio MIME type.
      type: input.audio.type,

      // Sends audio file name.
      name: input.audio.name,
    } as any);

    // Sends audio duration to backend.
    formData.append(
      'audio_duration_seconds',
      String(input.audio.durationSeconds),
    );

    // Sends audio MIME type separately to backend.
    formData.append('audio_mime_type', input.audio.type);
  }

  // Sends SOS POST request to backend.
  const response = await fetch(`http://${input.serverIp}:8000/api/sos`, {
    method: 'POST',
    body: formData,
  });

  // Converts backend response body into JSON.
  const result = await response.json();

  // Checks if HTTP response failed or backend returned success false.
  if (!response.ok || !result.success) {
    // Throws backend error message or fallback message.
    throw new Error(result.message || 'SOS failed');
  }

  // Returns full backend response.
  return result;
};
