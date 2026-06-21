// Defines the Android package name for this native module.
package com.womensafetyappstable

// Imports Android permission constants.
import android.Manifest

// Imports Android Notification class for notification settings.
import android.app.Notification

// Imports NotificationChannel for Android 8+ notification channel creation.
import android.app.NotificationChannel

// Imports NotificationManager to create/manage notification channels.
import android.app.NotificationManager

// Imports PendingIntent to open the app when notification is tapped.
import android.app.PendingIntent

// Imports Android Context to access system services.
import android.content.Context

// Imports Intent to open MainActivity from notification tap.
import android.content.Intent

// Imports PackageManager to check permission result.
import android.content.pm.PackageManager

// Imports BitmapFactory to decode launcher icon as large notification icon.
import android.graphics.BitmapFactory

// Imports AudioAttributes to configure emergency sound usage.
import android.media.AudioAttributes

// Imports Uri to create sound URI from raw resource.
import android.net.Uri

// Imports Build to check Android version.
import android.os.Build

// Imports ActivityCompat to check notification permission.
import androidx.core.app.ActivityCompat

// Imports NotificationCompat to build compatible notifications.
import androidx.core.app.NotificationCompat

// Imports NotificationManagerCompat to show notification.
import androidx.core.app.NotificationManagerCompat

// Imports Promise to send success/error result back to React Native.
import com.facebook.react.bridge.Promise

// Imports React application context.
import com.facebook.react.bridge.ReactApplicationContext

// Imports base class for creating React Native native module.
import com.facebook.react.bridge.ReactContextBaseJavaModule

// Imports annotation to expose Kotlin method to React Native.
import com.facebook.react.bridge.ReactMethod

// Native notification module exposed to React Native.
class NotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    // Unique notification channel ID used for emergency SOS buzzer alerts.
    private val channelId = "women_safety_emergency_buzzer_channel_v2"

    // User-visible notification channel name.
    private val channelName = "Emergency SOS Buzzer Alerts"

    // Returns the native module name used in React Native NativeModules.
    override fun getName(): String {
        return "NotificationModule"
    }

    // Exposes this method to React Native JS side.
    @ReactMethod
    fun showEmergencyNotification(title: String, message: String, promise: Promise) {
        try {
            // Creates notification channel before showing notification.
            createNotificationChannel()

            // Checks runtime notification permission only for Android 13+.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Checks POST_NOTIFICATIONS permission status.
                val permission = ActivityCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.POST_NOTIFICATIONS
                )

                // Stops if notification permission is not granted.
                if (permission != PackageManager.PERMISSION_GRANTED) {
                    // Sends permission denied error back to React Native.
                    promise.reject(
                        "NOTIFICATION_PERMISSION_DENIED",
                        "POST_NOTIFICATIONS permission is not granted"
                    )
                    return
                }
            }

            // Creates intent to open MainActivity when user taps notification.
            val intent = Intent(reactContext, MainActivity::class.java).apply {
                // Starts activity in new task and brings existing activity to top if already opened.
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            // Creates PendingIntent from the intent for notification tap action.
            val pendingIntent = PendingIntent.getActivity(
                reactContext,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Gets custom buzzer sound URI from raw resource.
            val buzzerSoundUri = getBuzzerSoundUri()

            // Loads app launcher icon as large notification icon.
            val largeIcon = BitmapFactory.decodeResource(
                reactContext.resources,
                R.mipmap.ic_launcher
            )

            // Builds the emergency SOS notification.
            val notification = NotificationCompat.Builder(reactContext, channelId)
                .setSmallIcon(R.drawable.ic_stat_sos)
                .setLargeIcon(largeIcon)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(buzzerSoundUri)
                .setVibrate(longArrayOf(0, 1000, 300, 1000, 300, 1000, 300, 1500))
                .setDefaults(Notification.DEFAULT_LIGHTS)
                .setContentIntent(pendingIntent)
                .build()

            // Shows the notification with a unique notification ID.
            NotificationManagerCompat.from(reactContext).notify(
                System.currentTimeMillis().toInt(),
                notification
            )

            // Sends success response back to React Native.
            promise.resolve(true)
        } catch (error: Exception) {
            // Sends notification failure error back to React Native.
            promise.reject("NOTIFICATION_FAILED", error.message, error)
        }
    }

    // Creates notification channel for Android 8+.
    private fun createNotificationChannel() {
        // Notification channels are required only for Android Oreo and above.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Gets custom buzzer sound URI.
            val buzzerSoundUri = getBuzzerSoundUri()

            // Builds audio attributes so SOS sound behaves like an alarm.
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            // Creates high importance notification channel.
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                // Sets channel description shown in Android settings.
                description = "Emergency SOS notifications with buzzer sound"

                // Enables vibration for this channel.
                enableVibration(true)

                // Sets emergency vibration pattern.
                vibrationPattern = longArrayOf(0, 1000, 300, 1000, 300, 1000, 300, 1500)

                // Sets custom buzzer sound for this channel.
                setSound(buzzerSoundUri, audioAttributes)

                // Makes notification visible on lock screen.
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            // Gets Android notification manager system service.
            val notificationManager =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Registers/creates the notification channel.
            notificationManager.createNotificationChannel(channel)
        }
    }

    // Returns URI for custom SOS buzzer sound from raw resource folder.
    private fun getBuzzerSoundUri(): Uri {
        return Uri.parse(
            "android.resource://${reactContext.packageName}/${R.raw.sos_buzzer}"
        )
    }
}