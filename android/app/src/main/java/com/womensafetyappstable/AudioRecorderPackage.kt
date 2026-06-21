// Defines the package name of this Android native package.
package com.womensafetyappstable

// Imports React Native package interfaces.
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

// Package class used to register AudioRecorderModule with React Native.
class AudioRecorderPackage : ReactPackage {

    // Creates native modules provided by this package.
    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> {
        // Returns the audio recorder module.
        return listOf(AudioRecorderModule(reactContext))
    }

    // No native UI views are provided by this package.
    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> {
        // Returns empty list because this module has no UI component.
        return emptyList()
    }
}