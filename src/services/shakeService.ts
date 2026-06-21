// Imports DeviceEventEmitter to listen to native events from Android.
// Imports NativeModules to access custom native Android shake module.
import { DeviceEventEmitter, NativeModules } from 'react-native';

// Gets ShakeModule from React Native NativeModules.
// This native module must be created and linked in Android native code.
const { ShakeModule } = NativeModules;

// Function to start shake detection.
// It receives onShake callback, which will run when shake is detected.
export const startShakeDetection = (onShake: () => void) => {
  // Checks whether native ShakeModule is available or not.
  if (!ShakeModule) {
    // Throws error if native module is not linked or app is not rebuilt.
    throw new Error('ShakeModule is not linked. Rebuild Android app.');
  }

  // Adds listener for SHAKE_DETECTED event sent from native Android code.
  const subscription = DeviceEventEmitter.addListener('SHAKE_DETECTED', () => {
    // Calls the callback function when shake is detected.
    onShake();
  });

  // Starts native Android shake sensor listening.
  ShakeModule.startListening();

  // Returns cleanup function to stop shake detection.
  return () => {
    // Removes the event listener to avoid duplicate callbacks and memory leak.
    subscription.remove();

    // Stops native Android shake sensor listening.
    ShakeModule.stopListening();
  };
};
