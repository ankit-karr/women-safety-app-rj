// Defines the package name of this Android native module.
package com.womensafetyappstable

// Imports Android media recorder API.
import android.media.MediaRecorder

// Imports Android OS build info.
import android.os.Build

// Imports Android handler for delayed stop.
import android.os.Handler

// Imports Android main looper.
import android.os.Looper

// Imports React Native bridge classes.
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// Imports Java File class.
import java.io.File

// Native module used to record emergency SOS audio.
class AudioRecorderModule(
    // React Native application context.
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    // Holds the current MediaRecorder instance.
    private var mediaRecorder: MediaRecorder? = null

    // Holds the current output audio file.
    private var outputFile: File? = null

    // Returns the native module name used in JavaScript.
    override fun getName(): String {
        // JS will call NativeModules.AudioRecorderModule.
        return "AudioRecorderModule"
    }

    // Creates MediaRecorder based on Android version.
    private fun createRecorder(): MediaRecorder {
        // Android S and above supports context constructor.
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(reactContext)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }
    }

    // Records emergency audio for a fixed number of seconds.
    @ReactMethod
    fun captureEmergencyAudio(durationSeconds: Int, promise: Promise) {
        try {
            // Stops previous recorder if somehow still active.
            stopAndReleaseRecorderSafely()

            // Uses at least 1 second to avoid invalid duration.
            val safeDurationSeconds = if (durationSeconds > 0) durationSeconds else 30

            // Creates audio file inside app cache directory.
            val audioFile = File(
                reactContext.cacheDir,
                "sos-audio-${System.currentTimeMillis()}.m4a"
            )

            // Saves output file reference.
            outputFile = audioFile

            // Creates a new MediaRecorder instance.
            val recorder = createRecorder()

            // Uses phone microphone as audio source.
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC)

            // Saves audio in MPEG_4 container.
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)

            // Uses AAC audio codec.
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)

            // Sets good voice quality bitrate.
            recorder.setAudioEncodingBitRate(128000)

            // Sets common audio sample rate.
            recorder.setAudioSamplingRate(44100)

            // Sets output file path.
            recorder.setOutputFile(audioFile.absolutePath)

            // Prepares recorder.
            recorder.prepare()

            // Starts recording.
            recorder.start()

            // Stores recorder reference.
            mediaRecorder = recorder

            // Stops recording after selected duration.
            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    // Stops active recording.
                    stopAndReleaseRecorderSafely()

                    // Creates response map.
                    val result = Arguments.createMap()

                    // Sends local audio file path to JS.
                    result.putString("path", audioFile.absolutePath)

                    // Sends audio MIME type.
                    result.putString("mimeType", "audio/mp4")

                    // Sends duration seconds.
                    result.putInt("durationSeconds", safeDurationSeconds)

                    // Sends file size.
                    result.putDouble("sizeBytes", audioFile.length().toDouble())

                    // Resolves JS promise.
                    promise.resolve(result)
                } catch (stopError: Exception) {
                    // Rejects if recorder failed to stop.
                    promise.reject("AUDIO_STOP_FAILED", stopError.message, stopError)
                }
            }, safeDurationSeconds * 1000L)
        } catch (error: Exception) {
            // Cleans recorder on start failure.
            stopAndReleaseRecorderSafely()

            // Rejects JS promise with error.
            promise.reject("AUDIO_RECORD_FAILED", error.message, error)
        }
    }

    // Stops and releases recorder safely.
    private fun stopAndReleaseRecorderSafely() {
        try {
            // Stops recorder if active.
            mediaRecorder?.stop()
        } catch (_: Exception) {
            // Ignores stop error because recorder may not have started fully.
        }

        try {
            // Resets recorder state.
            mediaRecorder?.reset()
        } catch (_: Exception) {
            // Ignores reset error.
        }

        try {
            // Releases recorder resources.
            mediaRecorder?.release()
        } catch (_: Exception) {
            // Ignores release error.
        }

        // Clears recorder reference.
        mediaRecorder = null
    }
}