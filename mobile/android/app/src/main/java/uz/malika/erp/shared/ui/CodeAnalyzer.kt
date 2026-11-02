package uz.malika.erp.shared.ui

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import uz.malika.erp.shared.lib.ImeiText

/**
 * Per-frame recognizer: any barcode/QR wins; if the frame has none, on-device
 * OCR looks for a printed IMEI ([ImeiText]). Both run fully offline.
 */
class CodeAnalyzer(private val onDetect: (String) -> Unit) : ImageAnalysis.Analyzer, AutoCloseable {
    private val barcodes = BarcodeScanning.getClient()
    private val text = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    @OptIn(ExperimentalGetImage::class)
    override fun analyze(proxy: ImageProxy) {
        val media = proxy.image ?: return proxy.close()
        val input = InputImage.fromMediaImage(media, proxy.imageInfo.rotationDegrees)
        barcodes.process(input)
            .addOnSuccessListener { found ->
                val code = found.firstNotNullOfOrNull { it.rawValue?.takeIf(String::isNotEmpty) }
                if (code != null) {
                    onDetect(code)
                    proxy.close()
                } else {
                    readImei(input, proxy)
                }
            }
            .addOnFailureListener { proxy.close() }
    }

    private fun readImei(input: InputImage, proxy: ImageProxy) {
        text.process(input)
            .addOnSuccessListener { result -> ImeiText.find(result.text)?.let(onDetect) }
            .addOnCompleteListener { proxy.close() }
    }

    override fun close() {
        barcodes.close()
        text.close()
    }
}
