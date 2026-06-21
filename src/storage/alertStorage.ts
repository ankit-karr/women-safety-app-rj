// Imports AsyncStorage to save and read data from mobile local storage.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Imports SOS alert message type.
import { SosAlertMessage } from '../types/contact.types';

// Storage key name used to save received SOS alerts in AsyncStorage.
const ALERT_STORAGE_KEY = 'WOMEN_SAFETY_RECEIVED_ALERTS';

// Function to get all received SOS alerts from local storage.
export const getReceivedAlerts = async (): Promise<SosAlertMessage[]> => {
  // Reads saved alerts string from AsyncStorage.
  const raw = await AsyncStorage.getItem(ALERT_STORAGE_KEY);

  // If no alerts are saved, return an empty array.
  if (!raw) {
    return [];
  }

  // Converts saved JSON string back into array and returns it.
  return JSON.parse(raw);
};

// Function to save full alert list in local storage.
export const saveReceivedAlerts = async (
  // List of SOS alerts to save.
  alerts: SosAlertMessage[],
): Promise<void> => {
  // Converts alerts array into JSON string and saves it in AsyncStorage.
  await AsyncStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts));
};

// Function to save one received SOS alert.
export const saveReceivedAlert = async (
  // New SOS alert to save.
  alert: SosAlertMessage,
): Promise<SosAlertMessage[]> => {
  // Gets already saved alerts from local storage.
  const existingAlerts = await getReceivedAlerts();

  // Removes old alert with the same alert_code to avoid duplicate entry.
  const filteredAlerts = existingAlerts.filter(
    item => item.alert_code !== alert.alert_code,
  );

  // Adds new alert at the top and keeps remaining old alerts after it.
  const updatedAlerts = [alert, ...filteredAlerts];

  // Saves updated alert list in local storage.
  await saveReceivedAlerts(updatedAlerts);

  // Returns updated alert list.
  return updatedAlerts;
};

// Function to clear all received SOS alerts from local storage.
export const clearReceivedAlerts = async (): Promise<void> => {
  // Removes the received alerts storage key from AsyncStorage.
  await AsyncStorage.removeItem(ALERT_STORAGE_KEY);
};
