// Defines the Android package name for this native module.
package com.womensafetyappstable

// Imports Android camera permission constant.
import android.Manifest

// Imports permission result constants.
import android.content.pm.PackageManager

// Imports Handler to run code on main/UI thread.
import android.os.Handler

// Imports Looper to get the main thread looper.
import android.os.Looper

// Imports CameraSelector to choose front or back camera.
import androidx.camera.core.CameraSelector

// Imports ImageCapture to capture photos.
import androidx.camera.core.ImageCapture

// Imports ImageCaptureException to handle camera capture errors.
import androidx.camera.core.ImageCaptureException

// Imports ProcessCameraProvider to bind camera with lifecycle.
import androidx.camera.lifecycle.ProcessCameraProvider

// Imports ActivityCompat for permission check and main executor.
import androidx.core.app.ActivityCompat

// Imports LifecycleOwner because CameraX needs lifecycle-aware activity.
import androidx.lifecycle.LifecycleOwner

// Imports Arguments to create React Native response objects/arrays.
import com.facebook.react.bridge.Arguments

// Imports Promise to send success/error response back to React Native.
import com.facebook.react.bridge.Promise

// Imports React application context.
import com.facebook.react.bridge.ReactApplicationContext

// Imports base class for creating React Native native module.
import com.facebook.react.bridge.ReactContextBaseJavaModule

// Imports annotation to expose Kotlin method to React Native.
import com.facebook.react.bridge.ReactMethod

// Imports WritableArray type for sending array response to JS.
import com.facebook.react.bridge.WritableArray

// Imports File to create image files in cache directory.
import java.io.File

// Imports ExecutorService to run camera work in background thread.
import java.util.concurrent.ExecutorService

// Imports Executors to create background executor.
import java.util.concurrent.Executors

// Native camera capture module exposed to React Native.
class CameraCaptureModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    // Single background thread used for camera capture work.
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    // Handler used to run CameraX/lifecycle work on main thread.
    private val mainHandler = Handler(Looper.getMainLooper())

    // Returns the native module name used in React Native NativeModules.
    override fun getName(): String {
        return "CameraCaptureModule"
    }

    // Exposes this method to React Native JS side.
    @ReactMethod
    fun captureEmergencyPhotos(countPerCamera: Int, promise: Promise) {
        // Gets current Android activity from React context.
        val activity = reactApplicationContext.currentActivity

        // Checks if current activity is available.
        if (activity == null) {
            // Sends error back to JS if activity is missing.
            promise.reject("NO_ACTIVITY", "Current activity is not available")
            return
        }

        // Checks if activity supports LifecycleOwner required by CameraX.
        if (activity !is LifecycleOwner) {
            // Sends error back to JS if activity is not lifecycle-aware.
            promise.reject("INVALID_ACTIVITY", "Activity is not LifecycleOwner")
            return
        }

        // Checks whether camera permission is granted.
        val permission = ActivityCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.CAMERA
        )

        // Stops process if camera permission is not granted.
        if (permission != PackageManager.PERMISSION_GRANTED) {
            // Sends permission denied error back to JS.
            promise.reject("CAMERA_PERMISSION_DENIED", "Camera permission is not granted")
            return
        }

        // Runs camera provider setup on main thread.
        mainHandler.post {
            try {
                // Gets CameraX camera provider instance.
                val cameraProviderFuture = ProcessCameraProvider.getInstance(reactContext)

                // Adds listener that runs when camera provider is ready.
                cameraProviderFuture.addListener({
                    try {
                        // Gets camera provider object.
                        val cameraProvider = cameraProviderFuture.get()

                        // Creates array that will store captured image details.
                        val resultArray = Arguments.createArray()

                        // Captures photos using back camera first.
                        captureForCamera(
                            cameraProvider = cameraProvider,
                            lifecycleOwner = activity,
                            cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA,
                            cameraType = "BACK",
                            count = countPerCamera,
                            resultArray = resultArray,
                            onComplete = {
                                // Checks if front camera exists after back camera capture completes.
                                if (cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA)) {
                                    // Captures photos using front camera.
                                    captureForCamera(
                                        cameraProvider = cameraProvider,
                                        lifecycleOwner = activity,
                                        cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA,
                                        cameraType = "FRONT",
                                        count = countPerCamera,
                                        resultArray = resultArray,
                                        onComplete = {
                                            // Runs final cleanup and promise resolve on main thread.
                                            mainHandler.post {
                                                try {
                                                    // Unbinds all cameras after capture is complete.
                                                    cameraProvider.unbindAll()
                                                } catch (_: Exception) {
                                                    // Ignores cleanup error.
                                                }

                                                // Sends captured image list back to React Native.
                                                promise.resolve(resultArray)
                                            }
                                        },
                                        onError = { error ->
                                            // Runs cleanup and error response on main thread.
                                            mainHandler.post {
                                                try {
                                                    // Unbinds cameras if front camera capture fails.
                                                    cameraProvider.unbindAll()
                                                } catch (_: Exception) {
                                                    // Ignores cleanup error.
                                                }

                                                // Sends front camera error back to React Native.
                                                promise.reject("FRONT_CAMERA_FAILED", error)
                                            }
                                        }
                                    )
                                } else {
                                    // If front camera does not exist, finish with only back camera images.
                                    mainHandler.post {
                                        try {
                                            // Unbinds all cameras after capture.
                                            cameraProvider.unbindAll()
                                        } catch (_: Exception) {
                                            // Ignores cleanup error.
                                        }

                                        // Sends captured back camera images back to React Native.
                                        promise.resolve(resultArray)
                                    }
                                }
                            },
                            onError = { error ->
                                // Runs cleanup and error response on main thread.
                                mainHandler.post {
                                    try {
                                        // Unbinds cameras if back camera capture fails.
                                        cameraProvider.unbindAll()
                                    } catch (_: Exception) {
                                        // Ignores cleanup error.
                                    }

                                    // Sends back camera error back to React Native.
                                    promise.reject("BACK_CAMERA_FAILED", error)
                                }
                            }
                        )
                    } catch (error: Exception) {
                        // Sends camera provider setup error back to React Native.
                        promise.reject("CAMERA_PROVIDER_FAILED", error.message, error)
                    }
                }, ActivityCompat.getMainExecutor(reactContext))
            } catch (error: Exception) {
                // Sends general camera capture setup error back to React Native.
                promise.reject("CAMERA_CAPTURE_FAILED", error.message, error)
            }
        }
    }

    // Captures multiple images for one selected camera.
    private fun captureForCamera(
        cameraProvider: ProcessCameraProvider,
        lifecycleOwner: LifecycleOwner,
        cameraSelector: CameraSelector,
        cameraType: String,
        count: Int,
        resultArray: WritableArray,
        onComplete: () -> Unit,
        onError: (String) -> Unit
    ) {
        // Runs camera binding on main thread.
        mainHandler.post {
            try {
                // Clears any previous camera binding.
                cameraProvider.unbindAll()

                // Creates image capture use case with low latency mode.
                val imageCapture = ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .build()

                // Binds selected camera and image capture use case to activity lifecycle.
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    imageCapture
                )

                // Starts recursive image capture for this camera.
                captureNextImage(
                    imageCapture = imageCapture,
                    cameraType = cameraType,
                    currentIndex = 1,
                    maxCount = count,
                    resultArray = resultArray,
                    onComplete = onComplete,
                    onError = onError
                )
            } catch (error: Exception) {
                // Sends camera bind error to caller.
                onError(error.message ?: "Camera bind failed")
            }
        }
    }

    // Captures one image at a time until maxCount is reached.
    private fun captureNextImage(
        imageCapture: ImageCapture,
        cameraType: String,
        currentIndex: Int,
        maxCount: Int,
        resultArray: WritableArray,
        onComplete: () -> Unit,
        onError: (String) -> Unit
    ) {
        // Stops recursion when required image count is completed.
        if (currentIndex > maxCount) {
            // Runs completion callback on main thread.
            mainHandler.post {
                onComplete()
            }
            return
        }

        // Creates unique file name for current SOS image.
        val fileName =
            "sos_${cameraType.lowercase()}_${System.currentTimeMillis()}_$currentIndex.jpg"

        // Creates image file inside app cache directory.
        val photoFile = File(reactContext.cacheDir, fileName)

        // Creates CameraX output options for saving photo into file.
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        // Captures image and saves it to the file.
        imageCapture.takePicture(
            outputOptions,
            cameraExecutor,
            object : ImageCapture.OnImageSavedCallback {
                // Runs when image is saved successfully.
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    // Creates map/object for this captured image.
                    val item = Arguments.createMap()

                    // Adds saved image file path.
                    item.putString("path", photoFile.absolutePath)

                    // Adds camera type, BACK or FRONT.
                    item.putString("cameraType", cameraType)

                    // Adds this image object to result array.
                    resultArray.pushMap(item)

                    // Waits 500ms before capturing next image.
                    mainHandler.postDelayed({
                        // Captures next image recursively.
                        captureNextImage(
                            imageCapture = imageCapture,
                            cameraType = cameraType,
                            currentIndex = currentIndex + 1,
                            maxCount = maxCount,
                            resultArray = resultArray,
                            onComplete = onComplete,
                            onError = onError
                        )
                    }, 500)
                }

                // Runs when image capture fails.
                override fun onError(exception: ImageCaptureException) {
                    // Sends capture error on main thread.
                    mainHandler.post {
                        onError(exception.message ?: "Image capture failed")
                    }
                }
            }
        )
    }
}