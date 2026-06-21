// Imports NativeModules to access custom native Android notification module.
// Imports PermissionsAndroid to request notification permission on Android.
// Imports Platform to check whether app is running on Android or iOS.
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// Gets NotificationModule from React Native NativeModules.
// This native module must be created and linked in Android native code.
const { NotificationModule } = NativeModules;

// Function to request notification permission from the user.
export const requestNotificationPermission = async (): Promise<boolean> => {
  // If device is not Android, return false because this permission flow is Android-specific.
  if (Platform.OS !== 'android') {
    return false;
  }

  // For Android versions below 13, notification permission is not required at runtime.
  if (Platform.Version < 33) {
    return true;
  }

  // Requests Android notification permission from the user.
  const granted = await PermissionsAndroid.request(
    // Android 13+ permission needed to show notifications.
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      // Permission popup title.
      title: 'Notification Permission Required',

      // Permission popup message shown to the user.
      message:
        'Women Safety App needs notification permission to show emergency SOS alerts.',

      // Positive button text in permission popup.
      buttonPositive: 'Allow',

      // Negative button text in permission popup.
      buttonNegative: 'Deny',
    },
  );

  // Returns true only if user grants notification permission.
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

// Function to show emergency notification using native Android module.
export const showEmergencyNotification = async (
  // Notification title.
  title: string,

  // Notification message/body.
  message: string,
) => {
  // Checks whether native NotificationModule is available or not.
  if (!NotificationModule) {
    // Throws error if native module is not linked or app is not rebuilt.
    throw new Error('NotificationModule is not linked. Rebuild Android app.');
  }

  // Requests/checks notification permission before showing notification.
  const hasPermission = await requestNotificationPermission();

  // Stops notification if permission is denied.
  if (!hasPermission) {
    throw new Error('Notification permission denied');
  }

  // Calls native Android function to show emergency notification.
  return NotificationModule.showEmergencyNotification(title, message);
};
