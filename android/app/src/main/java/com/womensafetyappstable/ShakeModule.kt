// Defines the Android package name for this native module.
package com.womensafetyappstable

// Imports Android Context to access system services.
import android.content.Context

// Imports Sensor class for accelerometer sensor.
import android.hardware.Sensor

// Imports SensorEvent to receive sensor value changes.
import android.hardware.SensorEvent

// Imports SensorEventListener to listen to sensor changes.
import android.hardware.SensorEventListener

// Imports SensorManager to manage device sensors.
import android.hardware.SensorManager

// Imports React application context.
import com.facebook.react.bridge.ReactApplicationContext

// Imports base class for creating React Native native module.
import com.facebook.react.bridge.ReactContextBaseJavaModule

// Imports annotation to expose Kotlin methods to React Native.
import com.facebook.react.bridge.ReactMethod

// Imports DeviceEventManagerModule to send native events to JavaScript.
import com.facebook.react.modules.core.DeviceEventManagerModule

// Imports sqrt function to calculate acceleration magnitude.
import kotlin.math.sqrt

// Native shake detection module exposed to React Native.
class ShakeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    // Holds Android sensor manager instance.
    private var sensorManager: SensorManager? = null

    // Holds accelerometer sensor instance.
    private var accelerometer: Sensor? = null

    // Stores last shake detected time to avoid repeated triggers.
    private var lastShakeTime: Long = 0

    // Minimum acceleration value required to detect shake.
    private val shakeThreshold = 18.0f

    // Minimum delay between two shake detections.
    private val shakeCooldownMs = 3000L

    // Returns the native module name used in React Native NativeModules.
    override fun getName(): String {
        return "ShakeModule"
    }

    // Starts listening to accelerometer sensor changes.
    @ReactMethod
    fun startListening() {
        // Gets Android sensor manager system service.
        sensorManager =
            reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager

        // Gets default accelerometer sensor from the device.
        accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        // Registers sensor listener only if accelerometer exists.
        accelerometer?.let {
            sensorManager?.registerListener(
                // Current class receives sensor callbacks.
                this,

                // Accelerometer sensor to listen to.
                it,

                // Sensor update speed suitable for UI-level detection.
                SensorManager.SENSOR_DELAY_UI
            )
        }
    }

    // Stops listening to accelerometer sensor changes.
    @ReactMethod
    fun stopListening() {
        // Unregisters this listener from sensor manager.
        sensorManager?.unregisterListener(this)
    }

    // Runs automatically whenever accelerometer sensor value changes.
    override fun onSensorChanged(event: SensorEvent?) {
        // If event is null, stop this function.
        if (event == null) return

        // Gets X-axis acceleration value.
        val x = event.values[0]

        // Gets Y-axis acceleration value.
        val y = event.values[1]

        // Gets Z-axis acceleration value.
        val z = event.values[2]

        // Calculates total acceleration from X, Y, and Z values.
        val acceleration = sqrt((x * x + y * y + z * z).toDouble()).toFloat()

        // Gets current timestamp in milliseconds.
        val currentTime = System.currentTimeMillis()

        // Checks if acceleration is above threshold and cooldown time has passed.
        if (
            acceleration > shakeThreshold &&
            currentTime - lastShakeTime > shakeCooldownMs
        ) {
            // Updates last shake time.
            lastShakeTime = currentTime

            // Sends SHAKE_DETECTED event from native Android to React Native JavaScript.
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("SHAKE_DETECTED", acceleration)
        }
    }

    // Runs when sensor accuracy changes. Not needed here, so kept empty.
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}