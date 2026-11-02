package uz.malika.erp.shared.ui

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import uz.malika.erp.shared.lib.ScanText

/**
 * Per-frame recognizer, fully offline. Any barcode/QR wins and fires [onDetect];
 * otherwise OCR looks for a printed IMEI ([ScanText.imei]) and fires [onDetect];
 * otherwise the printed numbers it saw go to [onNumbers] for the user to pick.
 */
class CodeAnalyzer(
    private val onDetect: (String) -> Unit,
    private val onNumbers: (List<String>) -> Unit,
) : ImageAnalysis.Analyzer, AutoCloseable {
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
                    readText(input, proxy)
                }
            }
            .addOnFailureListener { proxy.close() }
    }

    private fun readText(input: InputImage, proxy: ImageProxy) {
        text.process(input)
            .addOnSuccessListener { result ->
                val imei = ScanText.imei(result.text)
                if (imei != null) onDetect(imei) else onNumbers(ScanText.numbers(result.text))
            }
            .addOnCompleteListener { proxy.close() }
    }

    override fun close() {
        barcodes.close()
        text.close()
    }
}
