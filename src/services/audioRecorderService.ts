// Imports NativeModules to call custom Android native module.
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// Defines the shape of the emergency audio file returned from Android native module.
export type EmergencyAudioFile = {
  // Local file path returned by Android.
  path: string;

  // File URI used by FormData upload.
  uri: string;

  // Uploaded file name.
  name: string;

  // Audio MIME type.
  type: string;

  // Recorded duration in seconds.
  durationSeconds: number;
};

// Reads AudioRecorderModule from React Native native modules.
const { AudioRecorderModule } = NativeModules;

// Requests microphone permission from Android.
const requestAudioPermission = async (): Promise<boolean> => {
  // iOS is not supported in your current native module setup.
  if (Platform.OS !== 'android') {
    throw new Error('Audio recording is currently supported only on Android.');
  }

  // Requests Android microphone permission.
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone Permission',
      message:
        'This app needs microphone access to record emergency SOS audio.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  // Returns true only when permission is granted.
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

// Captures emergency audio for a fixed duration.
export const captureEmergencyAudio = async (
  durationSeconds: number,
): Promise<EmergencyAudioFile> => {
  // Checks whether native module exists.
  if (!AudioRecorderModule) {
    throw new Error('AudioRecorderModule is not linked. Rebuild Android app.');
  }

  // Requests microphone permission.
  const hasPermission = await requestAudioPermission();

  // Stops if permission is denied.
  if (!hasPermission) {
    throw new Error('Microphone permission denied.');
  }

  // Calls native Android module and waits until recording completes.
  const result = await AudioRecorderModule.captureEmergencyAudio(
    durationSeconds,
  );

  // Reads local path returned by native module.
  const path = String(result.path || '');

  // Validates that native module returned path.
  if (!path) {
    throw new Error('Audio recording failed. No audio path returned.');
  }

  // Creates proper file URI for React Native FormData upload.
  const uri = path.startsWith('file://') ? path : `file://${path}`;

  // Returns normalized audio object.
  return {
    path,
    uri,
    name: `sos-audio-${Date.now()}.m4a`,
    type: 'audio/mp4',
    durationSeconds: Number(result.durationSeconds || durationSeconds),
  };
};
