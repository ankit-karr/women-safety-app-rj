// Defines the Android package name for this native package.
package com.womensafetyappstable

// Imports ReactPackage interface used to register native modules.
import com.facebook.react.ReactPackage

// Imports NativeModule type for React Native native modules.
import com.facebook.react.bridge.NativeModule

// Imports React application context passed to native modules.
import com.facebook.react.bridge.ReactApplicationContext

// Imports ViewManager type for native UI components.
import com.facebook.react.uimanager.ViewManager

// Native package class used to register CameraCaptureModule with React Native.
class CameraCapturePackage : ReactPackage {

    // Creates and returns native modules available to React Native JS side.
    override fun createNativeModules(
        // React Native application context.
        reactContext: ReactApplicationContext
    ): List<NativeModule> {
        // Registers CameraCaptureModule and passes React context to it.
        return listOf(CameraCaptureModule(reactContext))
    }

    // Creates and returns native view managers.
    override fun createViewManagers(
        // React Native application context.
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> {
        // No native UI view managers are needed, so return empty list.
        return emptyList()
    }
}