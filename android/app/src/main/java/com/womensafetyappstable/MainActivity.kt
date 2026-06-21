// Defines the Android package name for this app.
package com.womensafetyappstable

// Imports ReactActivity, which is the main Android Activity for React Native.
import com.facebook.react.ReactActivity

// Imports ReactActivityDelegate used to configure React Native activity behavior.
import com.facebook.react.ReactActivityDelegate

// Imports default React Native activity delegate.
import com.facebook.react.defaults.DefaultReactActivityDelegate

// Main Android activity class for the React Native app.
class MainActivity : ReactActivity() {

    // Returns the main React Native component name registered from JavaScript side.
    override fun getMainComponentName(): String = "WomenSafetyAppStable"

    // Creates React activity delegate for this activity.
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(
            // Passes current activity instance.
            this,

            // Passes main component name returned by getMainComponentName().
            mainComponentName,

            // Disables Fabric new architecture renderer here.
            false
        )
}