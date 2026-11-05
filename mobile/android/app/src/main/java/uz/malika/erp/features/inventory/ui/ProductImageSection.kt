package uz.malika.erp.features.inventory.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.FileProvider
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.lib.ImageScaler
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ProductImage
import uz.malika.erp.ui.theme.Tokens
import java.io.File

/**
 * The product picture block of the model form (ADR 0031): shows the current
 * picture (or a placeholder), lets the operator pick one from the gallery or take
 * a photo (downscaled under 2 MB), and replace or remove it. The type and size
 * are checked before sending; the server's 400/413 map to clear messages. Online
 * only — the model must already exist (it needs an id), so this shows on edit.
 */
@Composable
fun ProductImageSection(
    modelId: String,
    initialImageUrl: String?,
    baseUrl: String,
    catalogVm: CatalogViewModel,
    online: Boolean,
    onToast: (String) -> Unit,
) {
    val t = LocalT.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var imageUrl by remember { mutableStateOf(initialImageUrl) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var cameraUri by remember { mutableStateOf<Uri?>(null) }

    fun send(uri: Uri) {
        error = null
        when (val prepared = ImageScaler.prepare(context, uri)) {
            ImageScaler.Result.TypeError -> error = t("catalog.errorPictureType", null)
            ImageScaler.Result.ReadError -> error = t("common.error", null)
            is ImageScaler.Result.Ok -> scope.launch {
                busy = true
                try {
                    val img = prepared.image
                    val view = catalogVm.uploadImage(modelId, img.bytes, img.mime, img.filename)
                    imageUrl = view.imageUrl
                    onToast(t("catalog.pictureSaved", null))
                } catch (e: AppException) {
                    error = uploadErrorKey(e)?.let { t(it, null) } ?: e.message
                } finally {
                    busy = false
                }
            }
        }
    }

    val gallery = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let(::send)
    }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        if (ok) cameraUri?.let(::send)
    }

    fun launchCamera() {
        val uri = captureUri(context)
        cameraUri = uri
        camera.launch(uri)
    }

    Column(Modifier.fillMaxWidth()) {
        Text(t("catalog.picture", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.rowV))
        ProductImage(
            imageUrl = imageUrl,
            baseUrl = baseUrl,
            contentDescription = t("catalog.picture", null),
            modifier = Modifier.fillMaxWidth().aspectRatio(1.6f),
        )
        Spacer(Modifier.height(Tokens.Space.rowV))
        Text(t("catalog.pictureHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.rowV))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
            PillButton(
                text = if (imageUrl != null) t("catalog.replacePicture", null) else t("catalog.uploadPicture", null),
                onClick = { gallery.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                enabled = online && !busy,
                variant = ButtonVariant.SECONDARY,
                modifier = Modifier.weight(1f),
            )
            Surface(
                onClick = { launchCamera() },
                enabled = online && !busy,
                shape = RoundedCornerShape(Tokens.Radius.buttons),
                color = Tokens.surface2,
            ) {
                Box(Modifier.size(Tokens.minTouch), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.PhotoCamera, contentDescription = t("catalog.picture", null), tint = Tokens.text)
                }
            }
        }
        if (imageUrl != null) {
            Spacer(Modifier.height(Tokens.Space.gap))
            PillButton(
                text = t("catalog.removePicture", null),
                onClick = {
                    error = null
                    scope.launch {
                        busy = true
                        try {
                            catalogVm.removeImage(modelId)
                            imageUrl = null
                            onToast(t("catalog.pictureRemoved", null))
                        } catch (e: AppException) {
                            error = e.message
                        } finally {
                            busy = false
                        }
                    }
                },
                enabled = online && !busy,
                variant = ButtonVariant.GHOST,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        error?.let {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
    }
}

/** Maps an image-upload failure to an i18n key: 413 → too large, 400 → wrong type. */
private fun uploadErrorKey(e: AppException): String? = when (e.statusCode) {
    413 -> "catalog.errorPictureSize"
    400 -> "catalog.errorPictureType"
    else -> null
}

/** A FileProvider URI for the camera to write the capture to (cache/captures). */
private fun captureUri(context: android.content.Context): Uri {
    val dir = File(context.cacheDir, "captures").apply { mkdirs() }
    val file = File(dir, "cap_${System.currentTimeMillis()}.jpg")
    return FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
}
