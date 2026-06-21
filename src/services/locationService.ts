// Imports PermissionsAndroid to request Android location permission.
// Imports Platform to check whether the app is running on Android or iOS.
import { PermissionsAndroid, Platform } from 'react-native';

// Imports geolocation service used to get current GPS location.
import Geolocation from 'react-native-geolocation-service';

// Defines the location response type.
export type CurrentLocation = {
  // Stores latitude value.
  latitude: number;

  // Stores longitude value.
  longitude: number;
};

// Function to request location permission from the user.
export const requestLocationPermission = async (): Promise<boolean> => {
  // If device is not Android, return true because this Android permission request is not needed here.
  if (Platform.OS !== 'android') {
    return true;
  }

  // Requests fine location permission from Android user.
  const fineLocationGranted = await PermissionsAndroid.request(
    // Android permission needed to access accurate GPS location.
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      // Permission popup title.
      title: 'Location Permission Required',

      // Permission popup message.
      message:
        'Women Safety App needs your location to send emergency SOS location.',

      // Positive button text.
      buttonPositive: 'Allow',

      // Negative button text.
      buttonNegative: 'Deny',
    },
  );

  // Returns true only if user grants fine location permission.
  return fineLocationGranted === PermissionsAndroid.RESULTS.GRANTED;
};

// Function to get current GPS location.
export const getCurrentLocation = async (): Promise<CurrentLocation> => {
  // Requests/checks location permission first.
  const hasPermission = await requestLocationPermission();

  // Stops location fetch if permission is denied.
  if (!hasPermission) {
    throw new Error('Location permission denied');
  }

  // Returns a promise because Geolocation.getCurrentPosition uses callback style.
  return new Promise((resolve, reject) => {
    // Gets current device location.
    Geolocation.getCurrentPosition(
      // Success callback runs when location is found.
      position => {
        // Sends latitude and longitude back to caller.
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },

      // Error callback runs when location fetch fails.
      error => {
        // Sends readable error message back to caller.
        reject(
          new Error(
            error.message ||
              'Unable to get current location. Please turn on GPS.',
          ),
        );
      },

      // Location fetch configuration.
      {
        // Uses GPS/high accuracy location.
        enableHighAccuracy: true,

        // Waits maximum 20 seconds for location.
        timeout: 20000,

        // Allows cached location only if it is not older than 5 seconds.
        maximumAge: 5000,

        // Forces Android to request fresh location.
        forceRequestLocation: true,

        // Shows location enable dialog if GPS/location is off.
        showLocationDialog: true,
      },
    );
  });
};
