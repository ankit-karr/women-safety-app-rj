// Defines the Android package name for this app.
package com.womensafetyappstable

// Imports Android Application class.
import android.app.Application

// Imports PackageList to get auto-linked React Native packages.
import com.facebook.react.PackageList

// Imports ReactApplication interface required by React Native Android app.
import com.facebook.react.ReactApplication

// Imports ReactHost used for React Native host setup.
import com.facebook.react.ReactHost

// Imports ReactNativeHost used to configure React Native app behavior.
import com.facebook.react.ReactNativeHost

// Imports ReactPackage type for native packages/modules.
import com.facebook.react.ReactPackage

// Imports helper to create default ReactHost.
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

// Imports default React Native host implementation.
import com.facebook.react.defaults.DefaultReactNativeHost

// Imports SoLoader mapping for native libraries.
import com.facebook.react.soloader.OpenSourceMergedSoMapping

// Imports SoLoader used to load native libraries.
import com.facebook.soloader.SoLoader

// Main Android application class for the React Native app.
class MainApplication : Application(), ReactApplication {

    // Creates React Native host configuration for the app.
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {

            // Returns all React Native packages used by the app.
            override fun getPackages(): List<ReactPackage> =
                // Gets all auto-linked packages and then manually adds custom native packages.
                PackageList(this).packages.apply {
                    // Adds custom shake detection native package.
                    add(ShakePackage())

                    // Adds custom SMS native package.
                    add(SmsPackage())

                    // Adds custom notification native package.
                    add(NotificationPackage())

                    // Adds custom camera capture native package.
                    add(CameraCapturePackage())

                    // add voice recording
                    add(AudioRecorderPackage())
                }

            // Returns the JavaScript entry file name.
            override fun getJSMainModuleName(): String = "index"

            // Enables developer support only in debug builds.
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            // Disables React Native new architecture.
            override val isNewArchEnabled: Boolean = false

            // Enables or disables Hermes based on BuildConfig setting.
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    // Creates ReactHost using default React Native host helper.
    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    // Runs when Android application starts.
    override fun onCreate() {
        // Calls parent Application onCreate.
        super.onCreate()

        // Initializes SoLoader for loading native libraries.
        SoLoader.init(this, OpenSourceMergedSoMapping)
    }
}