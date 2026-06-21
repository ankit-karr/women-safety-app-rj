// Imports React hooks used in this screen.
import React, {useCallback, useEffect, useRef, useState} from 'react';

// Imports React Native UI and device APIs.
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

// Imports navigation hook.
import {useNavigation} from '@react-navigation/native';

// Imports native stack navigation type.
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// Imports app navigation route type.
import {RootStackParamList} from '../../App';

// Imports app configuration constants.
import {
  DEFAULT_SERVER_IP,
  DEVICE_NAME,
  DANGER_AUDIO_RECORD_SECONDS,
  DANGER_IMAGE_COUNT_PER_CAMERA,
} from '../constants/config';

// Imports contact APIs.
import {
  createEmergencyContactApi,
  getEmergencyContactsApi,
} from '../api/contactApi';

// Imports device registration API.
import {registerDeviceApi} from '../api/deviceApi';

// Imports SOS backend API.
import {sendSosToBackend} from '../api/sosApi';

// Imports location service.
import {getCurrentLocation} from '../services/locationService';

// Imports receiver socket service.
import {
  connectReceiverSocket,
  ReceiverSocket,
} from '../services/receiverSocketService';

// Imports shake detection service.
import {startShakeDetection} from '../services/shakeService';

// Imports GSM SMS service.
import {sendGsmSmsToMany} from '../services/gsmSmsService';

// Imports emergency notification service.
import {showEmergencyNotification} from '../services/notificationService';

// Imports native camera capture service.
import {captureEmergencyPhotos} from '../services/nativeCameraService';

// Imports new emergency audio capture service.
import {
  captureEmergencyAudio,
  EmergencyAudioFile,
} from '../services/audioRecorderService';

// Imports app shared types.
import {
  DangerImage,
  EmergencyContact,
  SmsLog,
  SosAlertMessage,
} from '../types/contact.types';

// Imports emergency contact local storage helpers.
import {
  getEmergencyContacts,
  saveEmergencyContacts,
} from '../storage/contactStorage';

// Imports device UUID storage helper.
import {getOrCreateDeviceUuid} from '../storage/deviceStorage';

// Imports received alert storage helper.
import {saveReceivedAlert} from '../storage/alertStorage';

// Imports local ID generator.
import {createLocalId} from '../utils/id';

// Main Home screen component for the safety app.
export default function HomeScreen() {
  // Creates a navigation object used to move to other screens.
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Keeps the receiver socket instance without causing re-render.
  const receiverSocketRef = useRef<ReceiverSocket | null>(null);

  // Keeps the function used to stop shake detection.
  const stopShakeRef = useRef<null | (() => void)>(null);

  // Stores the backend/laptop IP address.
  const [serverIp, setServerIp] = useState(DEFAULT_SERVER_IP);

  // Stores this phone's unique device UUID.
  const [deviceUuid, setDeviceUuid] = useState('');

  // Stores the current user's name.
  const [userName, setUserName] = useState('Student User');

  // Stores the current user's optional phone number.
  const [userPhone, setUserPhone] = useState('');

  // Stores the contact name input value.
  const [contactName, setContactName] = useState('');

  // Stores the contact phone input value.
  const [contactPhone, setContactPhone] = useState('');

  // Stores emergency contacts shown in the UI and used for SOS.
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // Stores status text shown at the bottom of the screen.
  const [status, setStatus] = useState('Ready');

  // Tracks whether shake monitoring is currently active.
  const [shakeMonitorActive, setShakeMonitorActive] = useState(false);

  // Tracks whether receiver socket mode is currently active.
  const [receiverModeActive, setReceiverModeActive] = useState(false);

  // Prevents multiple SOS processes from running together.
  const [isProcessingDanger, setIsProcessingDanger] = useState(false);

  // Stores the latest SOS alert received from another device.
  const [lastReceiverAlert, setLastReceiverAlert] =
    useState<SosAlertMessage | null>(null);

  // Loads initial device UUID and saved contacts when the screen opens.
  const initializeApp = useCallback(async () => {
    try {
      // Gets existing UUID from storage or creates a new UUID.
      const localDeviceUuid = await getOrCreateDeviceUuid();

      // Saves UUID in React state so it appears in UI and API calls.
      setDeviceUuid(localDeviceUuid);

      // Loads contacts saved locally on the phone.
      const savedContacts = await getEmergencyContacts();

      // Shows saved contacts in the contact list.
      setContacts(savedContacts);

      // Shows app ready status with the UUID.
      setStatus(`App ready.\nDevice UUID: ${localDeviceUuid}`);
    } catch (error: any) {
      // Shows initialization error in the status box.
      setStatus(`Initialization error: ${error.message}`);
    }
  }, []);

  // Runs initialization on component mount and cleanup on unmount.
  useEffect(() => {
    // Starts app initialization.
    initializeApp();

    // Cleanup function runs when leaving this screen.
    return () => {
      // Stops shake detection if it is running.
      stopShakeRef.current?.();

      // Closes socket connection if it is open.
      receiverSocketRef.current?.close();
    };
  }, [initializeApp]);

  // Starts emergency vibration for 15 seconds.
  const startEmergencyVibration = () => {
    // Starts repeating vibration pattern.
    Vibration.vibrate([0, 1000, 500, 300], true);

    // Schedules vibration stop after 15 seconds.
    setTimeout(() => {
      // Stops device vibration.
      Vibration.cancel();
    }, 15000);
  };

  // Fetches active emergency contacts for SMS, using backend first and local fallback.
  const getAllContactsForSms = async (): Promise<EmergencyContact[]> => {
    // Holds contacts from backend or local storage.
    let finalContacts: EmergencyContact[] = [];

    try {
      // Validates that backend IP is present.
      if (!serverIp.trim()) {
        throw new Error('Server IP missing');
      }

      // Validates that device UUID is present.
      if (!deviceUuid.trim()) {
        throw new Error('Device UUID missing');
      }

      // Shows backend contact fetch status.
      setStatus('Fetching all emergency contacts from backend...');

      // Fetches contacts from backend database.
      const backendContacts = await getEmergencyContactsApi(serverIp, deviceUuid);

      // Uses backend contacts as final contacts.
      finalContacts = backendContacts;

      // Updates UI contact list from backend.
      setContacts(backendContacts);

      // Saves backend contacts locally for offline use.
      await saveEmergencyContacts(backendContacts);
    } catch {
      // Shows fallback status when backend fetch fails.
      setStatus('Backend contacts not reachable. Using local saved contacts...');

      // Loads local saved contacts.
      const localContacts = await getEmergencyContacts();

      // Uses local contacts as final contacts.
      finalContacts = localContacts;
    }

    // Creates a map to remove duplicate phone numbers.
    const uniqueContactsMap = new Map<string, EmergencyContact>();

    // Keeps only active unique phone numbers.
    finalContacts
      .filter(contact => contact.isActive)
      .forEach(contact => {
        // Removes spaces from phone number.
        const cleanPhone = contact.phone.replace(/\s/g, '').trim();

        // Stores contact only when phone exists.
        if (cleanPhone) {
          uniqueContactsMap.set(cleanPhone, {
            ...contact,
            phone: cleanPhone,
          });
        }
      });

    // Returns unique active contacts sorted by priority.
    return Array.from(uniqueContactsMap.values()).sort(
      (a, b) => a.priority - b.priority,
    );
  };

  // Registers this mobile device with the backend.
  const registerDevice = async () => {
    try {
      // Validates that backend IP is present.
      if (!serverIp.trim()) {
        Alert.alert('Error', 'Enter laptop IP address');
        return;
      }

      // Validates that user name is present.
      if (!userName.trim()) {
        Alert.alert('Error', 'Enter user name');
        return;
      }

      // Uses existing UUID or creates one before registration.
      const localDeviceUuid = deviceUuid || (await getOrCreateDeviceUuid());

      // Saves UUID in React state so it appears in UI and API calls.
      setDeviceUuid(localDeviceUuid);

      // Shows device registration status.
      setStatus('Registering device with backend...');

      // Sends device registration details to backend.
      await registerDeviceApi({
        serverIp,
        name: userName,
        phone: userPhone,
        deviceUuid: localDeviceUuid,
        deviceName: DEVICE_NAME,
        deviceType: 'ANDROID_BOTH',
      });

      // Shows success status after registration.
      setStatus('Device registered successfully.');

      try {
        // Tries to fetch contacts immediately after registration.
        const backendContacts = await getEmergencyContactsApi(
          serverIp,
          localDeviceUuid,
        );

        // Updates contacts in UI.
        setContacts(backendContacts);

        // Saves refreshed backend contacts locally.
        await saveEmergencyContacts(backendContacts);
      } catch {
        // Keeps registration successful even if contact refresh fails.
      }
    } catch (error: any) {
      // Shows registration error in the status box.
      setStatus(`Device registration error: ${error.message}`);
    }
  };

  // Adds a new emergency contact locally and in backend.
  const addContact = async () => {
    try {
      // Validates that backend IP is present.
      if (!serverIp.trim()) {
        Alert.alert('Error', 'Enter laptop IP address first');
        return;
      }

      // Validates that device UUID is present.
      if (!deviceUuid.trim()) {
        Alert.alert('Error', 'Register device first');
        return;
      }

      // Validates contact name.
      if (!contactName.trim()) {
        Alert.alert('Error', 'Enter contact name');
        return;
      }

      // Validates contact phone.
      if (!contactPhone.trim()) {
        Alert.alert('Error', 'Enter contact phone number');
        return;
      }

      // Builds a new contact object from input values.
      const newContact: EmergencyContact = {
        id: createLocalId(),
        name: contactName.trim(),
        phone: contactPhone.trim(),
        priority: contacts.length + 1,
        isActive: true,
      };

      // Adds the new contact to the current contact list.
      const updatedContacts = [...contacts, newContact];

      // Shows local save status.
      setStatus('Saving contact in mobile local storage...');

      // Saves updated contacts in mobile local storage.
      await saveEmergencyContacts(updatedContacts);

      // Shows backend save status.
      setStatus('Saving contact in MySQL database...');

      // Sends new contact details to backend database.
      await createEmergencyContactApi({
        serverIp,
        deviceUuid,
        contactName: newContact.name,
        phone: newContact.phone,
        relation: '',
        priority: newContact.priority,
      });

      // Uses local updated contacts by default.
      let finalContacts = updatedContacts;

      try {
        // Refreshes contacts from backend after saving.
        finalContacts = await getEmergencyContactsApi(serverIp, deviceUuid);
      } catch {
        // Keeps local contacts if backend refresh fails.
        finalContacts = updatedContacts;
      }

      // Updates UI contact list.
      setContacts(finalContacts);

      // Saves final contacts locally.
      await saveEmergencyContacts(finalContacts);

      // Clears contact name input.
      setContactName('');

      // Clears contact phone input.
      setContactPhone('');

      // Shows contact saved success status.
      setStatus('Contact saved in local storage and backend database.');
    } catch (error: any) {
      // Shows contact save error.
      setStatus(`Contact save error: ${error.message}`);
    }
  };

  // Deletes a contact from local storage only.
  const deleteContact = async (id: string) => {
    // Removes the selected contact from the current array.
    const updatedContacts = contacts.filter(contact => contact.id !== id);

    // Saves the updated contact list locally.
    await saveEmergencyContacts(updatedContacts);

    // Updates UI contact list.
    setContacts(updatedContacts);

    // Shows delete status.
    setStatus(
      'Contact deleted from local storage only. Backend delete API is not added yet.',
    );
  };

  // Manually refreshes emergency contacts from backend.
  const refreshContactsFromBackend = async () => {
    try {
      // Validates that backend IP is present.
      if (!serverIp.trim()) {
        Alert.alert('Error', 'Enter laptop IP address');
        return;
      }

      // Validates that device UUID is present.
      if (!deviceUuid.trim()) {
        Alert.alert('Error', 'Register device first');
        return;
      }

      // Shows backend refresh status.
      setStatus('Refreshing contacts from backend...');

      // Fetches contacts from backend database.
      const backendContacts = await getEmergencyContactsApi(serverIp, deviceUuid);

      // Updates UI contact list from backend.
      setContacts(backendContacts);

      // Saves backend contacts locally for offline use.
      await saveEmergencyContacts(backendContacts);

      // Shows total refreshed contacts.
      setStatus(`Contacts refreshed. Total: ${backendContacts.length}`);
    } catch (error: any) {
      // Shows refresh error.
      setStatus(`Refresh contacts error: ${error.message}`);
    }
  };

  // Opens the default SMS app with recipients and message filled.
  const openSmsAppForContacts = async (
    phoneNumbers: string[],
    message: string,
  ) => {
    // Combines phone numbers for SMS recipient list.
    const recipients = phoneNumbers.join(';');

    // Builds SMS URL with encoded message body.
    const smsUrl = `sms:${recipients}?body=${encodeURIComponent(message)}`;

    // Checks whether the phone can open SMS URL.
    const canOpen = await Linking.canOpenURL(smsUrl);

    // Throws error if SMS app cannot open.
    if (!canOpen) {
      throw new Error('SMS app cannot open on this phone');
    }

    // Opens the SMS app.
    await Linking.openURL(smsUrl);
  };

  // Sends automatic GSM SMS, and falls back to SMS app if automatic SMS fails.
  const sendAutomaticGsmSmsOrFallback = async (
    phoneNumbers: string[],
    message: string,
    triggeredBy: 'SOS_BUTTON' | 'SHAKE_DETECTION',
    mapLink: string,
  ) => {
    try {
      // Shows automatic SMS status.
      setStatus(
        `Sending automatic GSM SMS using mobile SIM...\nTotal Numbers: ${phoneNumbers.length}`,
      );

      // Sends SMS automatically using mobile SIM.
      await sendGsmSmsToMany(phoneNumbers, message);

      // Shows SMS success status.
      setStatus(
        `SOS completed.\nTriggered By: ${triggeredBy}\nLocation: ${mapLink}\nAutomatic GSM SMS sent to ${phoneNumbers.length} number(s).`,
      );
    } catch (smsError: any) {
      // Shows fallback reason.
      setStatus(
        `Automatic GSM SMS failed. Opening SMS app fallback.\nReason: ${smsError.message}`,
      );

      // Opens SMS app fallback for manual send.
      await openSmsAppForContacts(phoneNumbers, message);

      // Shows fallback status.
      setStatus(
        `SOS completed.\nTriggered By: ${triggeredBy}\nLocation: ${mapLink}\nSMS app opened for ${phoneNumbers.length} number(s). Please tap Send.`,
      );
    }
  };

  // Captures emergency photos safely and returns empty array on failure.
  const captureDangerImagesSafely = async (): Promise<DangerImage[]> => {
    try {
      // Shows camera capture status.
      setStatus('Capturing 5 back + 5 front emergency photos...');

      // Captures emergency photos using native camera service.
      const dangerImages = await captureEmergencyPhotos(
        DANGER_IMAGE_COUNT_PER_CAMERA,
      );

      // Shows captured photo count.
      setStatus(`Captured ${dangerImages.length} emergency photos.`);

      // Returns captured images.
      return dangerImages;
    } catch (cameraError: any) {
      // Shows camera failure status.
      setStatus(
        `Camera capture failed. SOS will continue without images.\nReason: ${cameraError.message}`,
      );

      // Continues SOS without images if camera capture fails.
      return [];
    }
  };

  // Captures emergency voice safely and returns null on failure.
  const captureDangerAudioSafely = async (): Promise<EmergencyAudioFile | null> => {
    try {
      // Shows audio recording status.
      setStatus(
        `Recording emergency voice for ${DANGER_AUDIO_RECORD_SECONDS} seconds...`,
      );

      // Captures emergency audio using native audio service.
      const audio = await captureEmergencyAudio(DANGER_AUDIO_RECORD_SECONDS);

      // Shows audio captured status.
      setStatus(
        `Emergency voice captured successfully.\nDuration: ${audio.durationSeconds} seconds.`,
      );

      // Returns captured audio.
      return audio;
    } catch (audioError: any) {
      // Shows audio failure status.
      setStatus(
        `Voice capture failed. SOS will continue without audio.\nReason: ${audioError.message}`,
      );

      // Continues SOS without audio if microphone or native module fails.
      return null;
    }
  };

  // Main SOS flow: validate, vibrate, capture images/audio, get location, save backend alert, send SMS.
  const sendSos = async (triggeredBy: 'SOS_BUTTON' | 'SHAKE_DETECTION') => {
    try {
      // Prevents duplicate SOS processing.
      if (isProcessingDanger) {
        setStatus('SOS is already processing. Please wait.');
        return;
      }

      // Marks SOS as currently processing.
      setIsProcessingDanger(true);

      // Validates that backend IP is present.
      if (!serverIp.trim()) {
        Alert.alert('Error', 'Enter laptop IP address');
        return;
      }

      // Validates that device UUID is present.
      if (!deviceUuid.trim()) {
        Alert.alert('Error', 'Register device first');
        return;
      }

      // Validates that user name is present.
      if (!userName.trim()) {
        Alert.alert('Error', 'Enter user name');
        return;
      }

      // Gets active contacts for SMS sending.
      const activeContacts = await getAllContactsForSms();

      // Ensures at least one emergency contact exists.
      if (activeContacts.length === 0) {
        Alert.alert('Error', 'Add at least one emergency contact');
        return;
      }

      // Starts emergency vibration before sending SOS.
      startEmergencyVibration();

// First record full emergency audio.
// Nothing else will run until this recording is completed.
setStatus(
  `Recording emergency voice for ${DANGER_AUDIO_RECORD_SECONDS} seconds...\nOther SOS actions will start after voice recording finishes.`,
);

const dangerAudio = await captureDangerAudioSafely();

// After audio recording is fully completed, start vibration.
startEmergencyVibration();

// Now capture emergency photos.
const dangerImages = await captureDangerImagesSafely();

// Now get current GPS location.
setStatus('Getting current location...');

const currentLocation = await getCurrentLocation();

      // Converts latitude to string for backend payload.
      const latitude = String(currentLocation.latitude);

      // Converts longitude to string for backend payload.
      const longitude = String(currentLocation.longitude);

      // Builds Google Maps location link.
      const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;

      // Extracts phone numbers from active contacts.
      const phoneNumbers = activeContacts.map(contact => contact.phone);

      // Creates SMS logs for backend payload.
      const smsLogs: SmsLog[] = activeContacts.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        status: 'SENT',
      }));

      // Default alert code when backend cannot be reached.
      let backendAlertCode = 'OFFLINE';

      try {
        // Shows backend upload status.
        setStatus(
          `Sending SOS, location, ${dangerImages.length} image(s), and ${
            dangerAudio ? 'voice audio' : 'no voice audio'
          } to backend...`,
        );

        // Sends SOS data, location, images, audio, and SMS logs to backend.
        const result = await sendSosToBackend({
          serverIp,
          deviceUuid,
          userName,
          latitude,
          longitude,
          smsStatus: 'PENDING',
          smsSentCount: activeContacts.length,
          smsFailedCount: 0,
          smsLogs,
          images: dangerImages,
          audio: dangerAudio,
          triggeredBy,
        });

        // Stores backend alert code returned by API.
        backendAlertCode = result.data.alert_code;

        // Shows backend success status.
        setStatus(
          `SOS saved in backend.\nAlert Code: ${backendAlertCode}\nImages Uploaded: ${dangerImages.length}\nVoice Uploaded: ${
            dangerAudio ? 'Yes' : 'No'
          }\nSending automatic GSM SMS to ${phoneNumbers.length} number(s)...`,
        );
      } catch (backendError: any) {
        // Shows backend failure but continues with SMS.
        setStatus(
          `Backend not reachable. Automatic GSM SMS will continue.\nImages captured: ${dangerImages.length}\nVoice captured: ${
            dangerAudio ? 'Yes' : 'No'
          }\nReason: ${backendError.message}`,
        );
      }

      // Builds the emergency SMS message.
      const smsMessage = `Emergency SOS!\n${userName} needs help.\nLocation: ${mapLink}\nAlert Code: ${backendAlertCode}`;

      // Sends automatic SMS or opens SMS fallback.
      await sendAutomaticGsmSmsOrFallback(
        phoneNumbers,
        smsMessage,
        triggeredBy,
        mapLink,
      );
    } catch (error: any) {
      // Stops device vibration.
      Vibration.cancel();

      // Shows SOS error.
      setStatus(`SOS error: ${error.message}`);
    } finally {
      // Allows future SOS actions again.
      setIsProcessingDanger(false);
    }
  };

  // Tests camera capture without sending SOS.
  const testCameraCapture = async () => {
    try {
      // Shows camera test status.
      setStatus('Testing camera capture...');

      // Captures emergency photos using native camera service.
      const dangerImages = await captureEmergencyPhotos(
        DANGER_IMAGE_COUNT_PER_CAMERA,
      );

      // Shows success status.
      setStatus(
        `Camera test successful.\nCaptured ${dangerImages.length} image(s).\nBack + Front camera capture completed.`,
      );
    } catch (error: any) {
      // Shows camera test error.
      setStatus(`Camera test error: ${error.message}`);
    }
  };

  // Tests audio recording without sending SOS.
  const testAudioCapture = async () => {
    try {
      // Shows audio test status.
      setStatus(
        `Testing voice capture for ${DANGER_AUDIO_RECORD_SECONDS} seconds...`,
      );

      // Captures test audio.
      const audio = await captureEmergencyAudio(DANGER_AUDIO_RECORD_SECONDS);

      // Shows audio test result.
      setStatus(
        `Voice test successful.\nPath: ${audio.path}\nDuration: ${audio.durationSeconds} seconds.`,
      );
    } catch (error: any) {
      // Shows audio test error.
      setStatus(`Voice test error: ${error.message}`);
    }
  };

  // Starts shake detection for automatic SOS.
  const startShakeMonitor = () => {
    try {
      // Prevents starting shake monitor twice.
      if (shakeMonitorActive) {
        setStatus('Shake monitor is already running.');
        return;
      }

      // Starts shake detector and stores stop function.
      stopShakeRef.current = startShakeDetection(() => {
        // Sends SOS only if SOS is not already processing.
        if (!isProcessingDanger) {
          sendSos('SHAKE_DETECTION');
        }
      });

      // Updates UI state to active.
      setShakeMonitorActive(true);

      // Shows status.
      setStatus('Shake monitor started. Strong shake will trigger SOS.');
    } catch (error: any) {
      // Shows shake monitor error.
      setStatus(`Shake monitor error: ${error.message}`);
    }
  };

  // Stops shake detection.
  const stopShakeMonitor = () => {
    // Calls stop function if available.
    stopShakeRef.current?.();

    // Clears stop function reference.
    stopShakeRef.current = null;

    // Updates UI state to inactive.
    setShakeMonitorActive(false);

    // Shows status.
    setStatus('Shake monitor stopped.');
  };

  // Starts receiver socket mode to listen for SOS alerts.
  const startReceiverMode = () => {
    try {
      // Validates that backend IP is present.
      if (!serverIp.trim()) {
        Alert.alert('Error', 'Enter laptop IP address');
        return;
      }

      // Closes socket connection if it is open.
      receiverSocketRef.current?.close();

      // Connects receiver socket and registers socket callbacks.
      receiverSocketRef.current = connectReceiverSocket({
        serverIp,

        // Runs when socket connects successfully.
        onOpen: () => {
          setReceiverModeActive(true);
          setStatus('Receiver mode connected.');
        },

        // Runs when socket disconnects.
        onClose: () => {
          setReceiverModeActive(false);
          setStatus('Receiver mode disconnected.');
        },

        // Runs when socket returns an error message.
        onError: message => {
          setStatus(`Receiver error: ${message}`);
        },

        // Runs when an SOS alert is received from socket.
        onAlert: async alert => {
          // Saves latest alert in state.
          setLastReceiverAlert(alert);

          // Saves received alert in local storage.
          await saveReceivedAlert(alert);

          // Sets notification title.
          const notificationTitle = 'Emergency SOS Received';

          // Builds notification body message.
          const notificationMessage = `${alert.user_name} needs help.\nLocation: ${alert.map_link}\nAlert Code: ${alert.alert_code}`;

          // Shows local emergency notification.
          showEmergencyNotification(notificationTitle, notificationMessage).catch(
            (error: any) => {
              setStatus(`Notification error: ${error.message}`);
            },
          );

          // Vibrates phone for received alert.
          Vibration.vibrate([0, 1200, 500, 1200, 500, 1200], false);

          // Shows alert popup with view details option.
          Alert.alert(notificationTitle, notificationMessage, [
            {
              text: 'View Details',
              onPress: () => {
                navigation.navigate('AlertDetails', {
                  alert,
                });
              },
            },
            {
              text: 'OK',
            },
          ]);

          // Shows receiver alert status.
          setStatus(
            `Receiver alert received.\nFrom: ${alert.user_name}\nAlert Code: ${alert.alert_code}`,
          );
        },
      });
    } catch (error: any) {
      // Shows receiver start error.
      setStatus(`Receiver start error: ${error.message}`);
    }
  };

  // Stops receiver socket mode.
  const stopReceiverMode = () => {
    // Closes active receiver socket.
    receiverSocketRef.current?.close();

    // Clears socket reference.
    receiverSocketRef.current = null;

    // Updates receiver mode state to inactive.
    setReceiverModeActive(false);

    // Shows status.
    setStatus('Receiver mode stopped.');
  };

  // Tests GPS location fetching.
  const testLocation = async () => {
    try {
      // Shows location fetch status.
      setStatus('Getting current location...');

      // Gets current GPS location.
      const currentLocation = await getCurrentLocation();

      // Builds Google Maps link for current test location.
      const mapLink = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;

      // Shows current location.
      setStatus(
        `Current location found:\nLatitude: ${currentLocation.latitude}\nLongitude: ${currentLocation.longitude}\n${mapLink}`,
      );
    } catch (error: any) {
      // Shows location error.
      setStatus(`Location error: ${error.message}`);
    }
  };

  // Tests emergency vibration pattern.
  const testVibration = () => {
    // Starts vibration test.
    startEmergencyVibration();
  };

  // Tests automatic GSM SMS without sending SOS.
  const testAutomaticSms = async () => {
    try {
      // Gets active contacts for SMS sending.
      const activeContacts = await getAllContactsForSms();

      // Ensures at least one emergency contact exists.
      if (activeContacts.length === 0) {
        Alert.alert('Error', 'Add at least one emergency contact');
        return;
      }

      // Extracts phone numbers from active contacts.
      const phoneNumbers = activeContacts.map(contact => contact.phone);

      // Shows SMS test status.
      setStatus(
        `Testing automatic GSM SMS...\nTotal Numbers: ${phoneNumbers.length}`,
      );

      // Sends test SMS using mobile SIM.
      await sendGsmSmsToMany(
        phoneNumbers,
        'Test SMS from Women Safety App using mobile SIM.',
      );

      // Shows success status.
      setStatus(
        `Test automatic GSM SMS sent successfully to ${phoneNumbers.length} number(s).`,
      );
    } catch (error: any) {
      // Shows SMS test error.
      setStatus(`Test SMS error: ${error.message}`);
    }
  };

  // Tests notification sound and vibration.
  const testNotification = async () => {
    try {
      // Shows notification test status.
      setStatus('Testing emergency notification...');

      // Shows a test emergency notification.
      await showEmergencyNotification(
        'Emergency SOS Test',
        'This is a test notification with buzzer sound and vibration.',
      );

      // Vibrates phone for test.
      Vibration.vibrate([0, 1200, 500, 1200], false);

      // Shows notification test result.
      setStatus('Test notification triggered.');
    } catch (error: any) {
      // Shows notification test error.
      setStatus(`Notification test error: ${error.message}`);
    }
  };

  // Renders the complete Home screen UI.
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>LIVE SAFETY MODE</Text>
          <Text style={styles.heroTitle}>Women Safety App</Text>
          <Text style={styles.heroSubtitle}>
            Shake detection, GPS location, automatic GSM SMS, camera capture,
            voice recording, backend SOS, receiver notification, sound, and
            vibration.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Camera + Voice SOS Enabled</Text>
          <Text style={styles.infoText}>
            When SOS is triggered, the app captures 5 back-camera and 5
            front-camera photos, records 30 seconds emergency voice, uploads
            them with location to backend, then sends GSM SMS.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Server & Device</Text>

          <Text style={styles.label}>Laptop IP</Text>
          <TextInput
            style={styles.input}
            value={serverIp}
            onChangeText={setServerIp}
            placeholder="192.168.1.8"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="Student User"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Your Phone Optional</Text>
          <TextInput
            style={styles.input}
            value={userPhone}
            onChangeText={setUserPhone}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={registerDevice}>
            <Text style={styles.buttonText}>REGISTER DEVICE</Text>
          </TouchableOpacity>

          <Text style={styles.deviceText}>
            Device UUID: {deviceUuid || 'Not loaded'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>

          <Text style={styles.label}>Contact Name</Text>
          <TextInput
            style={styles.input}
            value={contactName}
            onChangeText={setContactName}
            placeholder="Father"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Contact Phone</Text>
          <TextInput
            style={styles.input}
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={addContact}>
            <Text style={styles.buttonText}>ADD CONTACT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={refreshContactsFromBackend}>
            <Text style={styles.buttonText}>REFRESH CONTACTS FROM BACKEND</Text>
          </TouchableOpacity>

          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>No emergency contacts added.</Text>
          ) : (
            contacts.map(contact => (
              <View key={contact.id} style={styles.contactBox}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteContact(contact.id)}>
                  <Text style={styles.deleteText}>DELETE</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => sendSos('SOS_BUTTON')}>
          <Text style={styles.sosText}>SEND SOS NOW</Text>
          <Text style={styles.sosSubText}>
            Capture 10 photos + 30 sec voice + location + backend + GSM SMS
          </Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity
            style={
              shakeMonitorActive ? styles.dangerActionButton : styles.actionButton
            }
            onPress={shakeMonitorActive ? stopShakeMonitor : startShakeMonitor}>
            <Text style={styles.actionTitle}>
              {shakeMonitorActive ? 'Stop Shake' : 'Start Shake'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {shakeMonitorActive ? 'Monitoring active' : 'Auto SOS trigger'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              receiverModeActive
                ? styles.dangerActionButton
                : styles.actionButton
            }
            onPress={receiverModeActive ? stopReceiverMode : startReceiverMode}>
            <Text style={styles.actionTitle}>
              {receiverModeActive ? 'Stop Receiver' : 'Receiver Mode'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {receiverModeActive ? 'Listening now' : 'Get SOS alerts'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.buttonText}>VIEW SOS NOTIFICATIONS</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionButton} onPress={testLocation}>
            <Text style={styles.actionTitle}>Test Location</Text>
            <Text style={styles.actionSubtitle}>GPS check</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={testVibration}>
            <Text style={styles.actionTitle}>Test Vibration</Text>
            <Text style={styles.actionSubtitle}>15 sec vibration</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={testCameraCapture}>
          <Text style={styles.buttonText}>TEST CAMERA CAPTURE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={testAudioCapture}>
          <Text style={styles.buttonText}>TEST VOICE CAPTURE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={testNotification}>
          <Text style={styles.buttonText}>TEST NOTIFICATION SOUND</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={testAutomaticSms}>
          <Text style={styles.buttonText}>TEST AUTOMATIC GSM SMS</Text>
        </TouchableOpacity>

        {lastReceiverAlert ? (
          <View style={styles.receiverCard}>
            <Text style={styles.sectionTitle}>Last Receiver Alert</Text>

            <Text style={styles.statusText}>
              Code: {lastReceiverAlert.alert_code}
            </Text>

            <Text style={styles.statusText}>
              From: {lastReceiverAlert.user_name}
            </Text>

            <Text style={styles.statusText}>
              Location: {lastReceiverAlert.map_link}
            </Text>
          </View>
        ) : null}

        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Defines all styles used by this screen.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050816',
  },
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  heroBadge: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: '#064e3b',
    padding: 18,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  infoTitle: {
    color: '#d1fae5',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoText: {
    color: '#ecfdf5',
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#0f172a',
    padding: 18,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 7,
    marginTop: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#334155',
    padding: 15,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  deviceText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 12,
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 14,
  },
  contactBox: {
    backgroundColor: '#1e293b',
    padding: 13,
    borderRadius: 18,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  contactPhone: {
    color: '#cbd5e1',
    marginTop: 3,
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  sosButton: {
    backgroundColor: '#dc2626',
    padding: 24,
    borderRadius: 26,
    marginBottom: 18,
    alignItems: 'center',
  },
  sosText: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '900',
  },
  sosSubText: {
    color: '#fee2e2',
    fontSize: 13,
    marginTop: 5,
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  dangerActionButton: {
    flex: 1,
    backgroundColor: '#7f1d1d',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },
  actionSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  receiverCard: {
    backgroundColor: '#172554',
    padding: 18,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  statusCard: {
    backgroundColor: '#020617',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
});