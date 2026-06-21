// Defines the Android package name for this native module.
package com.womensafetyappstable

// Imports Android SMS permission constant.
import android.Manifest

// Imports permission result constants.
import android.content.pm.PackageManager

// Imports Android SmsManager used to send SMS from phone SIM.
import android.telephony.SmsManager

// Imports ActivityCompat to check Android runtime permission.
import androidx.core.app.ActivityCompat

// Imports Arguments to create React Native response objects/arrays.
import com.facebook.react.bridge.Arguments

// Imports Promise to send success/error response back to React Native.
import com.facebook.react.bridge.Promise

// Imports React application context.
import com.facebook.react.bridge.ReactApplicationContext

// Imports base class for creating React Native native module.
import com.facebook.react.bridge.ReactContextBaseJavaModule

// Imports annotation to expose Kotlin methods to React Native.
import com.facebook.react.bridge.ReactMethod

// Imports ReadableArray to receive phone number array from JavaScript.
import com.facebook.react.bridge.ReadableArray

// Native SMS module exposed to React Native.
class SmsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    // Returns the native module name used in React Native NativeModules.
    override fun getName(): String {
        return "SmsModule"
    }

    // Exposes this method to React Native JS side.
    @ReactMethod
    fun sendSmsToMany(phoneNumbers: ReadableArray, message: String, promise: Promise) {
        try {
            // Checks whether SEND_SMS permission is granted.
            val permission = ActivityCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.SEND_SMS
            )

            // Stops SMS sending if permission is not granted.
            if (permission != PackageManager.PERMISSION_GRANTED) {
                // Sends permission denied error back to React Native.
                promise.reject("SMS_PERMISSION_DENIED", "SEND_SMS permission is not granted")
                return
            }

            // Gets default Android SMS manager.
            val smsManager = SmsManager.getDefault()

            // Creates result array to store SMS status for each phone number.
            val resultArray = Arguments.createArray()

            // Loops through all phone numbers received from JavaScript.
            for (i in 0 until phoneNumbers.size()) {
                // Gets phone number at current index.
                val phone = phoneNumbers.getString(i)

                // Skips empty or blank phone numbers.
                if (phone.isNullOrBlank()) {
                    continue
                }

                // Creates result object for current phone number.
                val item = Arguments.createMap()

                // Adds phone number into result object.
                item.putString("phone", phone)

                try {
                    // Splits long SMS message into multiple parts if needed.
                    val messageParts = smsManager.divideMessage(message)

                    // Sends multipart SMS to current phone number.
                    smsManager.sendMultipartTextMessage(
                        phone,
                        null,
                        messageParts,
                        null,
                        null
                    )

                    // Marks current SMS as sent.
                    item.putString("status", "SENT")
                } catch (error: Exception) {
                    // Marks current SMS as failed if sending throws error.
                    item.putString("status", "FAILED")

                    // Adds SMS sending error message.
                    item.putString("errorMessage", error.message)
                }

                // Adds current phone SMS result into result array.
                resultArray.pushMap(item)
            }

            // Sends all SMS results back to React Native.
            promise.resolve(resultArray)
        } catch (error: Exception) {
            // Sends general SMS failure error back to React Native.
            promise.reject("SMS_SEND_FAILED", error.message, error)
        }
    }
}