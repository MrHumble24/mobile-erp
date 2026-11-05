package uz.malika.erp.features.inventory.lib

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.ByteArrayOutputStream

/**
 * Prepares a picked/captured picture for upload (ADR 0031): checks the type by
 * the leading bytes (never the file name), and when the file is over 2 MB —
 * typically a camera photo — downscales and re-encodes it to JPEG so it fits.
 * Small JPEG/PNG/WebP files are sent untouched to keep their quality. The server
 * repeats the type/size checks; this just spares the user a round-trip and keeps
 * camera photos under the cap.
 */
object ImageScaler {
    private const val MAX_BYTES = 2_000_000
    private const val MAX_DIM = 1600

    data class Prepared(val bytes: ByteArray, val mime: String, val filename: String)

    sealed interface Result {
        data class Ok(val image: Prepared) : Result
        /** Not a JPEG/PNG/WebP. */
        data object TypeError : Result
        /** The content could not be read or decoded. */
        data object ReadError : Result
    }

    fun prepare(context: Context, uri: Uri): Result {
        val raw = runCatching {
            context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
        }.getOrNull() ?: return Result.ReadError
        if (raw.isEmpty()) return Result.ReadError
        val mime = magicMime(raw) ?: return Result.TypeError
        if (raw.size <= MAX_BYTES) {
            return Result.Ok(Prepared(raw, mime, "image.${ext(mime)}"))
        }
        val jpeg = downscaleJpeg(raw) ?: return Result.ReadError
        return Result.Ok(Prepared(jpeg, "image/jpeg", "image.jpg"))
    }

    /** The image type from the leading bytes, or null when it is not one we accept. */
    fun magicMime(b: ByteArray): String? = when {
        b.size >= 3 && b[0] == 0xFF.toByte() && b[1] == 0xD8.toByte() && b[2] == 0xFF.toByte() -> "image/jpeg"
        b.size >= 8 && b[0] == 0x89.toByte() && b[1] == 0x50.toByte() &&
            b[2] == 0x4E.toByte() && b[3] == 0x47.toByte() -> "image/png"
        b.size >= 12 && b[0] == 'R'.code.toByte() && b[1] == 'I'.code.toByte() &&
            b[2] == 'F'.code.toByte() && b[3] == 'F'.code.toByte() &&
            b[8] == 'W'.code.toByte() && b[9] == 'E'.code.toByte() &&
            b[10] == 'B'.code.toByte() && b[11] == 'P'.code.toByte() -> "image/webp"
        else -> null
    }

    private fun ext(mime: String): String = when (mime) {
        "image/png" -> "png"
        "image/webp" -> "webp"
        else -> "jpg"
    }

    private fun downscaleJpeg(raw: ByteArray): ByteArray? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(raw, 0, raw.size, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
        var sample = 1
        val longest = maxOf(bounds.outWidth, bounds.outHeight)
        while (longest / sample > MAX_DIM) sample *= 2
        val bitmap = BitmapFactory.decodeByteArray(
            raw, 0, raw.size, BitmapFactory.Options().apply { inSampleSize = sample },
        ) ?: return null
        var quality = 90
        var out = compress(bitmap, quality)
        while (out.size > MAX_BYTES && quality > 40) {
            quality -= 10
            out = compress(bitmap, quality)
        }
        return out
    }

    private fun compress(bitmap: Bitmap, quality: Int): ByteArray =
        ByteArrayOutputStream().also { bitmap.compress(Bitmap.CompressFormat.JPEG, quality, it) }.toByteArray()
}
