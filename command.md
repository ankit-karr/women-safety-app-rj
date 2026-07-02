# Android App Setup & Run Guide

## Step 1: Check Connected Device

Run:

```bash
adb devices
```

Example Output:

```bash
List of devices attached
RZ8R91TCBLP    device
```

Copy the device ID from the output.

---

## Step 2: Reverse Port for Local Backend

Run:

```bash
adb -s 3C159K002PK00000 reverse tcp:8000 tcp:8000
```

This allows the Android device to access the backend running locally on port **8000**.

---

## Step 3: Clean Android Build

Navigate to the Android directory:

```bash
cd android
```

Run Gradle clean:

```bash
./gradlew clean
```

For Windows PowerShell:

```bash
.\gradlew clean
```

Wait for the cleaning process to complete.

---

## Step 4: Return to Project Root

```bash
cd ..
```

---

## Step 5: Build and Run the Application

Run:

```bash
npx react-native run-android
```

This will build and install the application on the connected Android device.

---

## Complete Command Sequence

```bash
adb devices

adb -s RZ8R91TCBLP reverse tcp:8000 tcp:8000

cd android

.\gradlew clean

cd ..

npx react-native run-android
```

## Notes

* Enable USB Debugging on the Android device.
* Verify that the device appears as `device` when running `adb devices`.
* Ensure the backend server is running on port `8000` before launching the application.
* Update the port number in the `adb reverse` command if your backend uses a different port.
ankit