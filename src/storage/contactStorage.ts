// Imports AsyncStorage to save and read data from mobile local storage.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Imports EmergencyContact type.
import { EmergencyContact } from '../types/contact.types';

// Storage key name used to save emergency contacts in AsyncStorage.
const CONTACTS_KEY = 'WOMEN_SAFETY_EMERGENCY_CONTACTS';

// Function to save emergency contacts in local storage.
export const saveEmergencyContacts = async (contacts: EmergencyContact[]) => {
  // Converts contacts array into JSON string and saves it in AsyncStorage.
  await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
};

// Function to get emergency contacts from local storage.
export const getEmergencyContacts = async (): Promise<EmergencyContact[]> => {
  // Reads saved contacts string from AsyncStorage.
  const data = await AsyncStorage.getItem(CONTACTS_KEY);

  // If no contacts are saved, return empty array.
  if (!data) {
    return [];
  }

  try {
    // Converts saved JSON string back into contacts array and returns it.
    return JSON.parse(data);
  } catch {
    // If saved data is invalid JSON, return empty array instead of crashing.
    return [];
  }
};
