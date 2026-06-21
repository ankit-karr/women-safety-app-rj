// Imports AsyncStorage to save and read data from mobile local storage.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Imports helper function used to create a local unique ID.
import { createLocalId } from '../utils/id';

// Storage key name used to save this device UUID in AsyncStorage.
const DEVICE_UUID_KEY = 'WOMEN_SAFETY_DEVICE_UUID';

// Function to get existing device UUID or create a new one if not found.
export const getOrCreateDeviceUuid = async () => {
  // Reads already saved device UUID from AsyncStorage.
  const existingDeviceUuid = await AsyncStorage.getItem(DEVICE_UUID_KEY);

  // If device UUID already exists, return the same UUID.
  if (existingDeviceUuid) {
    return existingDeviceUuid;
  }

  // Creates a new Android device UUID using local ID helper.
  const newDeviceUuid = `android-${createLocalId()}`;

  // Saves the newly created device UUID in AsyncStorage.
  await AsyncStorage.setItem(DEVICE_UUID_KEY, newDeviceUuid);

  // Returns the newly created device UUID.
  return newDeviceUuid;
};
