// Imports NativeModules to access custom native Android modules.
// Imports PermissionsAndroid to request SMS permission on Android.
// Imports Platform to check whether the app is running on Android or iOS.
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// Gets SmsModule from React Native NativeModules.
// This SmsModule must be created/linked in native Android code.
const { SmsModule } = NativeModules;

// Function to request SMS permission from the user.
export const requestSmsPermission = async (): Promise<boolean> => {
  // If the device is not Android, return false because SEND_SMS permission is Android-specific.
  if (Platform.OS !== 'android') {
    return false;
  }

  // Requests Android SEND_SMS permission from the user.
  const granted = await PermissionsAndroid.request(
    // Android permission needed to send SMS directly from the app.
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    {
      // Permission popup title.
      title: 'SMS Permission Required',

      // Permission popup message shown to the user.
      message:
        'Women Safety App needs SMS permission to automatically send emergency SOS using your mobile SIM.',

      // Positive button text in permission popup.
      buttonPositive: 'Allow',

      // Negative button text in permission popup.
      buttonNegative: 'Deny',
    },
  );

  // Returns true only when user grants SMS permission.
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

// Function to send one SMS message to multiple phone numbers using GSM/mobile SIM.
export const sendGsmSmsToMany = async (
  // List of phone numbers where SMS will be sent.
  phoneNumbers: string[],

  // SMS message body.
  message: string,
) => {
  // Checks whether native SmsModule is available or not.
  if (!SmsModule) {
    // Throws error if native SMS module is not linked/build properly.
    throw new Error('SmsModule is not linked. Rebuild Android app.');
  }

  // Requests/checks SMS permission before sending SMS.
  const hasPermission = await requestSmsPermission();

  // If permission is not granted, stop SMS sending.
  if (!hasPermission) {
    // Throws error when user denies SMS permission.
    throw new Error('SMS permission denied');
  }

  // Calls native Android function to send SMS to many numbers.
  return SmsModule.sendSmsToMany(phoneNumbers, message);
};


cd C:\Users\viree\Downloads\WomenSafetyAppStable\android

.\gradlew clean

cd C:\Users\viree\Downloads\WomenSafetyAppStable

npx react-native run-android