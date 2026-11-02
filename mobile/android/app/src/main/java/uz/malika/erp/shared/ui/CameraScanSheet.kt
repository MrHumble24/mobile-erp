package uz.malika.erp.shared.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import java.util.concurrent.Executors

/**
 * Live camera scanner (CameraX preview + [CodeAnalyzer]): barcodes, QR codes and
 * printed IMEI numbers fire [onDetect] on their own; any other printed number shows
 * under the preview for the user to tap. The caller dismisses the sheet.
 * Requests CAMERA at first mount; without it, shows an inline message.
 */
@Composable
fun CameraScanSheet(onDetect: (String) -> Unit, permissionMessage: String) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var granted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED,
        )
    }
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted = it }
    LaunchedEffect(Unit) { if (!granted) launcher.launch(Manifest.permission.CAMERA) }

    if (!granted) {
        EmptyView(permissionMessage, Modifier.fillMaxWidth().height(200.dp))
        return
    }

    val analysisExecutor = remember { Executors.newSingleThreadExecutor() }
    var numbers by remember { mutableStateOf(emptyList<String>()) }
    val analyzer = remember {
        // Newest first, capped, so the row stays steady while OCR jitters frame to frame.
        CodeAnalyzer(onDetect) { seen -> numbers = (seen + numbers).distinct().take(MAX_NUMBERS) }
    }
    DisposableEffect(Unit) {
        onDispose {
            analysisExecutor.shutdown()
            analyzer.close()
        }
    }

    Column {
        AndroidView(
            modifier = Modifier.fillMaxWidth().height(360.dp),
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val providerFuture = ProcessCameraProvider.getInstance(ctx)
                providerFuture.addListener({
                    val provider = providerFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.surfaceProvider = previewView.surfaceProvider
                    }
                    val analysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                    analysis.setAnalyzer(analysisExecutor, analyzer)
                    provider.unbindAll()
                    provider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        analysis,
                    )
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            },
        )
        ScannedNumbers(numbers, onPick = onDetect)
    }
}

private const val MAX_NUMBERS = 8
