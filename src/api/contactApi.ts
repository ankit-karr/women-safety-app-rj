// Imports EmergencyContact type used for contact list response.
import { EmergencyContact } from '../types/contact.types';

// Defines input type required to create an emergency contact.
type CreateContactInput = {
  // Backend server/laptop IP address.
  serverIp: string;

  // Unique device UUID linked with this contact.
  deviceUuid: string;

  // Emergency contact person name.
  contactName: string;

  // Emergency contact phone number.
  phone: string;

  // Optional relation value like Father, Mother, Friend, etc.
  relation?: string;

  // Contact priority/order for SOS sending.
  priority: number;
};

// Function to create/save emergency contact in backend database.
export const createEmergencyContactApi = async (input: CreateContactInput) => {
  // Creates FormData because backend expects form-data request body.
  const formData = new FormData();

  // Adds device UUID to form data.
  formData.append('device_uuid', input.deviceUuid);

  // Adds contact name to form data.
  formData.append('contact_name', input.contactName);

  // Adds contact phone number to form data.
  formData.append('phone', input.phone);

  // Adds relation to form data, or empty string if relation is not provided.
  formData.append('relation', input.relation ?? '');

  // Adds priority as string because FormData values should be string/blob.
  formData.append('priority', String(input.priority));

  // Sends POST request to backend emergency contact create API.
  const response = await fetch(
    `http://${input.serverIp}:8000/api/emergency-contacts`,
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
    throw new Error(result.message || 'Contact save failed');
  }

  // Returns full backend response.
  return result;
};

// Function to fetch emergency contacts from backend by device UUID.
export const getEmergencyContactsApi = async (
  // Backend server/laptop IP address.
  serverIp: string,

  // Unique device UUID used to find contacts.
  deviceUuid: string,
): Promise<EmergencyContact[]> => {
  // Sends GET request to backend emergency contact list API.
  const response = await fetch(
    `http://${serverIp}:8000/api/emergency-contacts/${deviceUuid}`,
  );

  // Converts backend response body into JSON.
  const result = await response.json();

  // Checks if HTTP response failed or backend returned success false.
  if (!response.ok || !result.success) {
    // Throws backend error message or fallback message.
    throw new Error(result.message || 'Contact fetch failed');
  }

  // Converts backend contact format into app EmergencyContact format.
  return (result.data ?? []).map((item: any) => ({
    // Converts backend id to string for frontend/local usage.
    id: String(item.id),

    // Maps backend contact_name to frontend name.
    name: item.contact_name,

    // Maps phone number.
    phone: item.phone,

    // Maps relation, or empty string if relation is missing.
    relation: item.relation ?? '',

    // Maps priority, or uses 1 as default.
    priority: item.priority ?? 1,

    // Maps active status, or true as default.
    isActive: item.is_active ?? true,
  }));
};
