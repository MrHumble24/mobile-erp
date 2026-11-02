package uz.malika.erp.shared.ui

import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.text.input.ImeAction

/**
 * Scan input for a hardware HID scanner (keyboard-wedge: types the code + Enter)
 * AND the phone camera. The field stays focused so a wedge scan lands here;
 * [onScan] fires on submit or on a camera detection. Visible, so a cashier can
 * also type/paste an IMEI. Duplicate scans within 1.2s are dropped.
 */
private const val DEDUPE_WINDOW_MS = 1200L

@Composable
fun ScannerField(
    onScan: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    cameraPermissionMessage: String = "Camera permission needed",
    autofocus: Boolean = true,
    enableCamera: Boolean = true,
) {
    var text by remember { mutableStateOf("") }
    var lastCode by remember { mutableStateOf<String?>(null) }
    var lastAt by remember { mutableLongStateOf(0L) }
    var showCamera by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }

    fun submit(raw: String) {
        val code = raw.trim()
        text = ""
        if (autofocus) runCatching { focusRequester.requestFocus() }
        if (code.isEmpty()) return
        val now = System.currentTimeMillis()
        if (code == lastCode && now - lastAt < DEDUPE_WINDOW_MS) return // duplicate
        lastCode = code
        lastAt = now
        onScan(code)
    }

    if (autofocus) {
        LaunchedEffect(Unit) { runCatching { focusRequester.requestFocus() } }
    }

    AppTextField(
        value = text,
        onValueChange = { text = it },
        modifier = modifier.focusRequester(focusRequester),
        placeholder = placeholder,
        imeAction = ImeAction.Done,
        keyboardActions = KeyboardActions(onDone = { submit(text) }),
        leadingIcon = { Icon(Icons.Outlined.QrCodeScanner, contentDescription = null) },
        trailingIcon = if (enableCamera) {
            {
                IconButton(onClick = { showCamera = true }) {
                    Icon(Icons.Outlined.PhotoCamera, contentDescription = null)
                }
            }
        } else {
            null
        },
    )

    if (showCamera) {
        AppBottomSheet(onDismiss = { showCamera = false }) {
            CameraScanSheet(
                onDetect = {
                    showCamera = false
                    submit(it)
                },
                permissionMessage = cameraPermissionMessage,
            )
        }
    }
}
