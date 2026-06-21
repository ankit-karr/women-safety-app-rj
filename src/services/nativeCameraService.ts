// Imports NativeModules to access custom native Android camera module.
// Imports PermissionsAndroid to request camera permission on Android.
// Imports Platform to check whether app is running on Android or iOS.
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// Imports DangerImage type for captured emergency image response.
import { DangerImage } from '../types/contact.types';

// Gets CameraCaptureModule from React Native NativeModules.
// This native module must be created and linked in Android native code.
const { CameraCaptureModule } = NativeModules;

// Function to request camera permission from the user.
export const requestCameraPermission = async (): Promise<boolean> => {
  // If device is not Android, return false because this native camera flow is Android-specific.
  if (Platform.OS !== 'android') {
    return false;
  }

  // Requests Android camera permission from the user.
  const granted = await PermissionsAndroid.request(
    // Android permission needed to access the camera.
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      // Permission popup title.
      title: 'Camera Permission Required',

      // Permission popup message shown to the user.
      message:
        'Women Safety App needs camera permission to capture emergency SOS photos.',

      // Positive button text in permission popup.
      buttonPositive: 'Allow',

      // Negative button text in permission popup.
      buttonNegative: 'Deny',
    },
  );

  // Returns true only if user grants camera permission.
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

// Function to capture emergency photos from native Android camera module.
export const captureEmergencyPhotos = async (
  // Number of photos to capture from each camera. Default is 5.
  countPerCamera = 5,
): Promise<DangerImage[]> => {
  // Checks whether native camera module is available or not.
  if (!CameraCaptureModule) {
    // Throws error if native module is not linked or app is not rebuilt.
    throw new Error('CameraCaptureModule is not linked. Rebuild Android app.');
  }

  // Requests/checks camera permission before capturing photos.
  const hasPermission = await requestCameraPermission();

  // Stops photo capture if camera permission is denied.
  if (!hasPermission) {
    throw new Error('Camera permission denied');
  }

  // Calls native Android module to capture emergency photos.
  const result = await CameraCaptureModule.captureEmergencyPhotos(
    countPerCamera,
  );

  // Converts native module result into DangerImage[] format.
  return (result ?? []).map((item: any) => ({
    // Stores captured image file path.
    path: item.path,

    // Stores which camera captured this image, like front or back.
    cameraType: item.cameraType,
  }));
};
