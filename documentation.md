# Women Safety Mobile App Documentation

## 1. Project Introduction

This mobile app is part of the **Women Safety System** project.

The main purpose of this app is to help a user send an emergency SOS alert when they are in danger.

When the user triggers SOS from the mobile app, the app collects the user's current GPS location, captures emergency photos, sends emergency SMS using the phone SIM, sends SOS data to the backend, and also supports receiver mode to receive emergency alerts from other devices.

This app works as both:

1. **Sender App** - sends SOS alert during danger.
2. **Receiver App** - listens for SOS alerts from backend using WebSocket.

The app is built using **React Native** with custom **Android Native Modules** written in Kotlin.

---

## 2. What You Are Building

You are building a mobile app where:

1. A user enters backend/laptop IP address.
2. The app creates or loads a unique device UUID.
3. The user registers the mobile device with the backend.
4. The user adds emergency contacts.
5. Emergency contacts are saved locally and also sent to backend.
6. The user can trigger SOS manually using the SOS button.
7. The app can trigger SOS automatically using shake detection.
8. The app captures emergency photos using front and back camera.
9. The app gets current GPS location.
10. The app sends SOS details, images, and SMS logs to backend.
11. The app sends automatic GSM SMS using the phone SIM.
12. If automatic SMS fails, the app opens the SMS app as fallback.
13. The receiver mode connects with backend WebSocket.
14. The receiver app receives SOS alerts instantly.
15. The receiver app shows notification, vibration, and alert popup.
16. The user can view saved SOS notifications.
17. The user can open SOS alert details with location and images.

---

## 3. Simple System Flow

```txt
Sender Mobile App
        |
        | Register Device
        v
Women Safety Backend
        |
        | Save Device in MySQL
        v
Device Registered


Sender Mobile App
        |
        | Add Emergency Contact
        v
Women Safety Backend
        |
        | Save Contact in MySQL
        v
Contact Saved


Sender Mobile App
        |
        | SOS Button / Shake Detection
        v
Get GPS Location
        |
        v
Capture Front + Back Camera Photos
        |
        v
Send SOS Data + Images to Backend
        |
        v
Backend Saves SOS Alert in MySQL
        |
        v
Backend Broadcasts Alert using WebSocket
        |
        v
Receiver Mobile App Gets Alert


Sender Mobile App
        |
        | Send GSM SMS using Phone SIM
        v
Emergency Contacts Receive SMS
```

---

## 4. Mobile App Main Features

### 4.1 Device Registration

The app registers the mobile device with the backend.

The following data is sent during registration:

| Field | Meaning |
|---|---|
| name | User name |
| phone | Optional user phone number |
| device_uuid | Unique mobile device ID |
| device_name | Android phone/device name |
| device_type | ANDROID_SENDER, ANDROID_RECEIVER, or ANDROID_BOTH |
| fcm_token | Optional notification token |

The device UUID is stored locally using AsyncStorage.

---

### 4.2 Emergency Contacts

The user can add emergency contacts from the mobile app.

Each contact has:

| Field | Meaning |
|---|---|
| id | Local/backend contact ID |
| name | Contact person name |
| phone | Contact phone number |
| relation | Optional relation |
| priority | Contact order |
| isActive | Whether contact is active or not |

Contacts are saved in two places:

1. Mobile local storage using AsyncStorage.
2. Backend MySQL database using API.

If backend contact fetch fails, the app uses locally saved contacts as fallback.

---

### 4.3 Manual SOS

The user can press **SEND SOS NOW** button.

When this button is pressed, the app starts the full SOS flow:

1. Checks whether SOS is already processing.
2. Validates server IP.
3. Validates device UUID.
4. Validates user name.
5. Loads active emergency contacts.
6. Starts emergency vibration.
7. Captures emergency photos.
8. Gets current GPS location.
9. Creates Google Maps link.
10. Sends SOS data to backend.
11. Sends GSM SMS to contacts.
12. If GSM SMS fails, opens default SMS app.
13. Updates status message in the UI.

---

### 4.4 Shake Detection SOS

The app has shake detection support using a custom native Android module.

When shake monitor is started:

1. Android accelerometer sensor starts listening.
2. If phone shake acceleration crosses threshold, native module emits `SHAKE_DETECTED`.
3. React Native receives this event.
4. The app calls SOS flow automatically with trigger type `SHAKE_DETECTION`.

The native shake module uses:

```txt
SensorManager
Accelerometer
DeviceEventManagerModule
SHAKE_DETECTED event
```

---

### 4.5 Camera Capture

The app captures emergency photos using a custom native Android CameraX module.

During SOS:

1. The app requests camera permission.
2. Native module opens back camera.
3. It captures configured number of back camera photos.
4. It opens front camera if available.
5. It captures configured number of front camera photos.
6. It returns image paths to React Native.
7. React Native uploads these images to backend using FormData.

Default image count:

```ts
DANGER_IMAGE_COUNT_PER_CAMERA = 5
```

So, by default:

```txt
5 back-camera photos + 5 front-camera photos = 10 emergency photos
```

---

### 4.6 GPS Location

The app uses `react-native-geolocation-service` to get current location.

The app requests:

```txt
ACCESS_FINE_LOCATION
ACCESS_COARSE_LOCATION
```

Location response contains:

```ts
{
  latitude: number;
  longitude: number;
}
```

The app creates Google Maps link like this:

```txt
https://maps.google.com/?q=latitude,longitude
```

---

### 4.7 GSM SMS Sending

The app sends emergency SMS directly using the phone SIM.

The SMS module is a custom Android native module.

The app requests:

```txt
SEND_SMS
```

The SMS message contains:

```txt
Emergency SOS!
User Name needs help.
Location: Google Maps Link
Alert Code: Backend Alert Code
```

If automatic SMS sending fails, the app opens the default SMS app with recipients and message already filled.

---

### 4.8 Receiver Mode

The app can work as a receiver device also.

When receiver mode starts:

1. App connects to backend WebSocket.
2. Backend sends SOS alert in real time.
3. App saves the alert in AsyncStorage.
4. App shows emergency notification.
5. App vibrates the phone.
6. App shows alert popup.
7. User can open Alert Details screen.

WebSocket URL format:

```txt
ws://SERVER_IP:8000/ws/alerts
```

---

### 4.9 Emergency Notification

The app uses a custom native Android notification module.

When receiver gets an SOS alert:

1. App creates notification channel.
2. App checks Android 13+ notification permission.
3. App shows emergency notification.
4. Notification plays custom buzzer sound.
5. Notification vibrates using emergency vibration pattern.
6. User can tap notification to open the app.

Permission used:

```txt
POST_NOTIFICATIONS
```

Custom sound file:

```txt
res/raw/sos_buzzer
```

---

### 4.10 Saved SOS Notifications

The app saves received SOS alerts locally using AsyncStorage.

The user can open the **SOS Notifications** screen.

On this screen, user can:

1. View all received SOS alerts.
2. Refresh saved alerts.
3. Clear saved alerts.
4. Tap any alert to view details.

---

### 4.11 Alert Details

The Alert Details screen shows:

1. Alert code.
2. User name.
3. Trigger type.
4. Latitude.
5. Longitude.
6. Image count.
7. Created date.
8. Button to open location in map.
9. Captured emergency images.

It also calls backend API to fetch latest alert details by alert code.

---

## 5. App Screens

## 5.1 Home Screen

File:

```txt
src/screens/HomeScreen.tsx
```

Main responsibilities:

1. Load device UUID.
2. Load saved emergency contacts.
3. Register device.
4. Add emergency contacts.
5. Refresh contacts from backend.
6. Send manual SOS.
7. Start/stop shake monitor.
8. Start/stop receiver mode.
9. Test location.
10. Test vibration.
11. Test camera capture.
12. Test notification.
13. Test automatic GSM SMS.
14. Show system status.

---

## 5.2 Notifications Screen

File:

```txt
src/screens/NotificationsScreen.tsx
```

Main responsibilities:

1. Load saved received alerts.
2. Show alert list.
3. Refresh alerts.
4. Clear alerts.
5. Navigate to Alert Details screen.

---

## 5.3 Alert Details Screen

File:

```txt
src/screens/AlertDetailsScreen.tsx
```

Main responsibilities:

1. Receive alert data from navigation.
2. Fetch latest alert details from backend.
3. Show alert information.
4. Show captured images.
5. Open location in map.

---

## 6. Folder Structure

```txt
src
├── api
│   ├── alertApi.ts
│   ├── contactApi.ts
│   ├── deviceApi.ts
│   └── sosApi.ts
│
├── constants
│   └── config.ts
│
├── screens
│   ├── HomeScreen.tsx
│   ├── NotificationsScreen.tsx
│   └── AlertDetailsScreen.tsx
│
├── services
│   ├── gsmSmsService.ts
│   ├── locationService.ts
│   ├── nativeCameraService.ts
│   ├── notificationService.ts
│   ├── receiverSocketService.ts
│   └── shakeService.ts
│
├── storage
│   ├── alertStorage.ts
│   ├── contactStorage.ts
│   └── deviceStorage.ts
│
├── types
│   └── contact.types.ts
│
└── utils
    └── id.ts
```

---

## 7. API Files

## 7.1 deviceApi.ts

Used to register the mobile device with backend.

API endpoint:

```txt
POST /api/devices/register
```

Request type:

```txt
FormData
```

Fields:

```txt
name
phone
device_uuid
device_name
device_type
fcm_token
```

---

## 7.2 contactApi.ts

Used to create and fetch emergency contacts.

Create contact endpoint:

```txt
POST /api/emergency-contacts
```

Fetch contacts endpoint:

```txt
GET /api/emergency-contacts/:deviceUuid
```

---

## 7.3 sosApi.ts

Used to send SOS alert data to backend.

Endpoint:

```txt
POST /api/sos
```

Request type:

```txt
FormData
```

Fields:

```txt
device_uuid
user_name
latitude
longitude
triggered_by
sms_status
sms_sent_count
sms_failed_count
sms_logs_json
camera_types_json
images
```

---

## 7.4 alertApi.ts

Used to fetch SOS alert details by alert code.

Endpoint:

```txt
GET /api/sos-alerts/:alertCode
```

---

## 8. Local Storage

The app uses AsyncStorage for local persistence.

## 8.1 Device UUID Storage

File:

```txt
src/storage/deviceStorage.ts
```

Storage key:

```txt
WOMEN_SAFETY_DEVICE_UUID
```

Purpose:

```txt
Store unique device UUID permanently on the phone.
```

---

## 8.2 Emergency Contact Storage

File:

```txt
src/storage/contactStorage.ts
```

Storage key:

```txt
WOMEN_SAFETY_EMERGENCY_CONTACTS
```

Purpose:

```txt
Store emergency contacts locally for offline fallback.
```

---

## 8.3 Received Alert Storage

File:

```txt
src/storage/alertStorage.ts
```

Storage key:

```txt
WOMEN_SAFETY_RECEIVED_ALERTS
```

Purpose:

```txt
Store SOS alerts received through WebSocket.
```

---

## 9. React Native Services

## 9.1 locationService.ts

Purpose:

```txt
Request location permission and get current GPS location.
```

Uses:

```txt
PermissionsAndroid
react-native-geolocation-service
```

---

## 9.2 gsmSmsService.ts

Purpose:

```txt
Request SMS permission and send SMS using native SmsModule.
```

Uses:

```txt
NativeModules.SmsModule
PermissionsAndroid.SEND_SMS
```

---

## 9.3 nativeCameraService.ts

Purpose:

```txt
Request camera permission and capture emergency photos using native CameraCaptureModule.
```

Uses:

```txt
NativeModules.CameraCaptureModule
PermissionsAndroid.CAMERA
```

---

## 9.4 notificationService.ts

Purpose:

```txt
Request notification permission and show emergency notification using native NotificationModule.
```

Uses:

```txt
NativeModules.NotificationModule
PermissionsAndroid.POST_NOTIFICATIONS
```

---

## 9.5 receiverSocketService.ts

Purpose:

```txt
Connect to backend WebSocket and receive SOS alerts.
```

Socket URL:

```txt
ws://SERVER_IP:8000/ws/alerts
```

Expected alert type:

```txt
SOS_ALERT
```

---

## 9.6 shakeService.ts

Purpose:

```txt
Start native shake detection and listen for SHAKE_DETECTED event.
```

Uses:

```txt
NativeModules.ShakeModule
DeviceEventEmitter
```

---

## 10. Android Native Modules

The app uses custom Android native modules written in Kotlin.

Native modules are placed inside:

```txt
android/app/src/main/java/com/womensafetyappstable
```

---

## 10.1 ShakeModule

Files:

```txt
ShakeModule.kt
ShakePackage.kt
```

Purpose:

```txt
Detect strong phone shake using accelerometer sensor.
```

Main native method:

```txt
startListening()
stopListening()
```

Event emitted to React Native:

```txt
SHAKE_DETECTED
```

---

## 10.2 SmsModule

Files:

```txt
SmsModule.kt
SmsPackage.kt
```

Purpose:

```txt
Send SMS directly using Android SmsManager.
```

Main native method:

```txt
sendSmsToMany(phoneNumbers, message)
```

Android permission:

```txt
SEND_SMS
```

---

## 10.3 NotificationModule

Files:

```txt
NotificationModule.kt
NotificationPackage.kt
```

Purpose:

```txt
Show emergency notification with buzzer sound and vibration.
```

Main native method:

```txt
showEmergencyNotification(title, message)
```

Android permission:

```txt
POST_NOTIFICATIONS
```

---

## 10.4 CameraCaptureModule

Files:

```txt
CameraCaptureModule.kt
CameraCapturePackage.kt
```

Purpose:

```txt
Capture emergency photos from back and front camera using CameraX.
```

Main native method:

```txt
captureEmergencyPhotos(countPerCamera)
```

Android permission:

```txt
CAMERA
```

---

## 11. Native Module Registration

Custom packages are added in `MainApplication.kt`.

```kotlin
add(ShakePackage())
add(SmsPackage())
add(NotificationPackage())
add(CameraCapturePackage())
```

This makes native modules available in React Native:

```ts
NativeModules.ShakeModule
NativeModules.SmsModule
NativeModules.NotificationModule
NativeModules.CameraCaptureModule
```

---

## 12. Android Permissions

The app uses these Android permissions in `AndroidManifest.xml`.

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Permission meaning:

| Permission | Purpose |
|---|---|
| INTERNET | Backend API and WebSocket connection |
| VIBRATE | Emergency vibration |
| CAMERA | Capture SOS photos |
| ACCESS_FINE_LOCATION | Accurate GPS location |
| ACCESS_COARSE_LOCATION | Approximate location |
| SEND_SMS | Send GSM SMS using SIM |
| POST_NOTIFICATIONS | Show notifications on Android 13+ |

---

## 13. Android Manifest Important Settings

The app allows cleartext HTTP traffic:

```xml
android:usesCleartextTraffic="true"
```

This is needed because local backend URL uses:

```txt
http://SERVER_IP:8000
ws://SERVER_IP:8000
```

The app launch activity is:

```xml
android:name=".MainActivity"
```

The launch mode is:

```xml
android:launchMode="singleTask"
```

---

## 14. Configuration File

File:

```txt
src/constants/config.ts
```

Example:

```ts
export const DEFAULT_SERVER_IP = '192.168.1.5';
export const DEFAULT_LATITUDE = '26.1445';
export const DEFAULT_LONGITUDE = '91.7362';
export const DEVICE_NAME = 'Android Phone';
export const DANGER_IMAGE_COUNT_PER_CAMERA = 5;
```

Important note:

```txt
DEFAULT_SERVER_IP must be changed based on your laptop/backend IP address.
```

---

## 15. Complete SOS Flow

```txt
User Presses SOS Button
        |
        v
Check if SOS already processing
        |
        v
Validate Server IP, Device UUID, User Name
        |
        v
Fetch Active Emergency Contacts
        |
        v
Start Emergency Vibration
        |
        v
Capture Emergency Photos
        |
        v
Get Current GPS Location
        |
        v
Create Google Maps Link
        |
        v
Prepare SMS Logs
        |
        v
Send SOS Data + Images to Backend
        |
        v
Receive Alert Code from Backend
        |
        v
Send Automatic GSM SMS
        |
        v
If SMS Fails, Open SMS App Fallback
        |
        v
Show Final Status
```

---

## 16. Complete Receiver Flow

```txt
User Starts Receiver Mode
        |
        v
App Connects to WebSocket
        |
        v
Backend Sends SOS_ALERT
        |
        v
App Saves Alert Locally
        |
        v
App Shows Emergency Notification
        |
        v
App Vibrates
        |
        v
App Shows Alert Popup
        |
        v
User Opens Alert Details
        |
        v
App Fetches Latest Alert Details
        |
        v
App Shows Location and Images
```

---

## 17. Test Flow

## 17.1 Before Testing

Make sure:

1. Backend is running.
2. Phone and laptop are connected to the same Wi-Fi.
3. `DEFAULT_SERVER_IP` or input IP is your laptop IP.
4. Android app is rebuilt after adding native modules.
5. Required permissions are allowed.
6. Backend port `8000` is accessible from phone.
7. Android cleartext traffic is enabled.

---

## 17.2 Device Registration Test

Steps:

1. Open app.
2. Enter laptop IP.
3. Enter user name.
4. Press **REGISTER DEVICE**.
5. Check status message.
6. Check backend database device table.

Expected result:

```txt
Device registered successfully.
```

---

## 17.3 Contact Test

Steps:

1. Enter contact name.
2. Enter contact phone.
3. Press **ADD CONTACT**.
4. Press **REFRESH CONTACTS FROM BACKEND**.

Expected result:

```txt
Contact saved in local storage and backend database.
```

---

## 17.4 Location Test

Steps:

1. Press **Test Location**.
2. Allow location permission.
3. Turn on GPS if needed.

Expected result:

```txt
Latitude and Longitude should show in status.
```

---

## 17.5 Camera Test

Steps:

1. Press **TEST CAMERA CAPTURE**.
2. Allow camera permission.

Expected result:

```txt
Camera test successful.
Captured image count should show.
```

---

## 17.6 Vibration Test

Steps:

1. Press **Test Vibration**.

Expected result:

```txt
Phone should vibrate for around 15 seconds.
```

---

## 17.7 Notification Test

Steps:

1. Press **TEST NOTIFICATION SOUND**.
2. Allow notification permission if Android 13+.

Expected result:

```txt
Emergency test notification should appear with sound and vibration.
```

---

## 17.8 SMS Test

Steps:

1. Add at least one emergency contact.
2. Press **TEST AUTOMATIC GSM SMS**.
3. Allow SMS permission.

Expected result:

```txt
SMS should be sent using phone SIM.
```

---

## 17.9 Manual SOS Test

Steps:

1. Register device.
2. Add emergency contact.
3. Allow location permission.
4. Allow camera permission.
5. Allow SMS permission.
6. Press **SEND SOS NOW**.

Expected result:

```txt
SOS data should be saved in backend.
Images should be uploaded.
SMS should be sent.
Backend should broadcast alert.
```

---

## 17.10 Receiver Mode Test

Steps:

1. Open app on receiver phone.
2. Enter backend/laptop IP.
3. Press **Receiver Mode**.
4. Trigger SOS from sender phone.

Expected result:

```txt
Receiver phone should get notification, vibration, popup, and saved alert.
```

---

## 18. Common Errors and Fixes

## 18.1 Native Module is not linked

Example error:

```txt
SmsModule is not linked. Rebuild Android app.
```

Reason:

```txt
Native module package was added but Android app was not rebuilt.
```

Fix:

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

---

## 18.2 Backend not reachable

Reason:

1. Wrong laptop IP.
2. Phone and laptop are not on same Wi-Fi.
3. Backend is not running.
4. Firewall blocks port 8000.
5. Server is listening only on localhost.

Fix:

1. Use correct laptop IP.
2. Run backend on `0.0.0.0`.
3. Allow port `8000` in firewall.
4. Test backend API from phone browser.

---

## 18.3 SMS permission denied

Reason:

```txt
User denied SEND_SMS permission.
```

Fix:

```txt
Go to Android App Settings > Permissions > SMS > Allow.
```

---

## 18.4 Camera permission denied

Reason:

```txt
User denied CAMERA permission.
```

Fix:

```txt
Go to Android App Settings > Permissions > Camera > Allow.
```

---

## 18.5 Location not working

Possible reasons:

1. GPS is off.
2. Location permission denied.
3. Phone cannot get GPS signal.
4. Emulator location is not configured.

Fix:

1. Turn on location.
2. Allow location permission.
3. Test on real Android device.
4. Move near open area if GPS is weak.

---

## 18.6 Notification not showing

Possible reasons:

1. Android 13+ notification permission denied.
2. Notification channel disabled.
3. App notification blocked from settings.
4. Sound file missing.

Fix:

1. Allow notification permission.
2. Check app notification settings.
3. Confirm `sos_buzzer` exists in `res/raw`.
4. Reinstall app if channel sound was changed.

---

## 18.7 Camera captures only back camera

Possible reasons:

1. Device does not have front camera.
2. Front camera access failed.
3. CameraX failed to bind front camera.

Fix:

1. Test on real device with front camera.
2. Check native logs using Logcat.
3. Confirm camera permission is granted.

---

## 19. Important Security Notes

This app handles sensitive emergency data.

Important data includes:

1. User location.
2. Emergency contact phone numbers.
3. Emergency photos.
4. Device information.
5. SOS alert history.

Production recommendations:

1. Use HTTPS instead of HTTP.
2. Use WSS instead of WS.
3. Add authentication for APIs.
4. Encrypt sensitive local storage if needed.
5. Restrict backend access.
6. Validate uploaded images on backend.
7. Avoid exposing backend IP publicly.
8. Add proper user consent for SMS, camera, and location permissions.

---

## 20. Current App Limitations

1. Backend IP is manually entered or stored as default.
2. SMS sending depends on Android device SIM and permission.
3. iOS is not supported for native SMS/camera/shake modules in current setup.
4. Images are stored temporarily in app cache before upload.
5. Receiver mode needs the app to keep socket connection active.
6. Push notification using FCM is not fully implemented yet.
7. Contact delete is currently local only if backend delete API is not added.
8. HTTP cleartext traffic is enabled for local testing.

---

## 21. Future Improvements

Recommended future improvements:

1. Add login/authentication.
2. Add backend contact delete API.
3. Add FCM push notification.
4. Add background SOS trigger support.
5. Add background WebSocket/reconnect logic.
6. Add panic button widget.
7. Add trusted receiver dashboard.
8. Add audio recording during SOS.
9. Add video recording during SOS.
10. Add location tracking after SOS.
11. Add retry queue for failed SOS upload.
12. Add encrypted local storage.
13. Add production HTTPS support.
14. Add admin panel for alert monitoring.
15. Add SOS cancellation flow.
16. Add battery optimization warning.
17. Add emergency contact priority management.
18. Add alert acknowledged/resolved status.

---

## 22. Summary

The Women Safety Mobile App is a React Native Android app that can send and receive emergency SOS alerts.

It supports:

1. Device registration.
2. Emergency contact management.
3. Manual SOS.
4. Shake-based SOS.
5. GPS location.
6. Camera photo capture.
7. GSM SMS sending.
8. Backend SOS upload.
9. WebSocket receiver mode.
10. Emergency notification.
11. Saved alert history.
12. Alert detail viewing.

This app works together with the Women Safety Backend to create a local emergency safety system.
