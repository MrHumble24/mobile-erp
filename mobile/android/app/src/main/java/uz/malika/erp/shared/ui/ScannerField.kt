package uz.malika.erp.shared.ui

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import kotlinx.coroutines.delay
import uz.malika.erp.shared.lib.rememberHaptics

/**
 * Scan input for a hardware HID scanner (keyboard-wedge: types the code + Enter)
 * AND the phone camera. The field autofocuses so a wedge scan lands here, but the
 * scanning station is never buried under the soft keyboard: on the programmatic
 * focus the IME is actively dismissed (`SoftwareKeyboardController.hide()` after a
 * 50ms settle, and again on every `onFocusChanged` while `userTapped` is false),
 * because the legacy `OutlinedTextField` inside a `ModalBottomSheet` ignores
 * `showKeyboardOnFocus`. The IME comes up only when the user presses the field
 * (a `PressInteraction.Press` sets `userTapped` and calls `show()`), so manual
 * entry still works; `submit()` refocuses, clears `userTapped` and hides again so
 * the keyboard never lingers between scans. [onScan] fires on submit
 * (`fromCamera = false`) or on a camera detection (`fromCamera = true`).
 * Duplicate scans within 1.2s are dropped.
 */
private const val DEDUPE_WINDOW_MS = 1200L
private const val HIDE_SETTLE_MS = 50L

@Composable
fun ScannerField(
    onScan: (code: String, fromCamera: Boolean) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    cameraPermissionMessage: String = "Camera permission needed",
    autofocus: Boolean = false,
    enableCamera: Boolean = true,
) {
    var text by remember { mutableStateOf("") }
    var lastCode by remember { mutableStateOf<String?>(null) }
    var lastAt by remember { mutableLongStateOf(0L) }
    var showCamera by remember { mutableStateOf(false) }
    var userTapped by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }
    val keyboard = LocalSoftwareKeyboardController.current
    val interactionSource = remember { MutableInteractionSource() }
    val haptics = rememberHaptics()

    // A press is the user asking to type by hand → let the IME come up.
    LaunchedEffect(interactionSource) {
        interactionSource.interactions.collect { interaction ->
            if (interaction is PressInteraction.Press) {
                userTapped = true
                keyboard?.show()
            }
        }
    }

    fun submit(raw: String, fromCamera: Boolean) {
        val code = raw.trim()
        text = ""
        userTapped = false
        if (autofocus) {
            runCatching { focusRequester.requestFocus() }
            keyboard?.hide()
        }
        if (code.isEmpty()) return
        val now = System.currentTimeMillis()
        if (code == lastCode && now - lastAt < DEDUPE_WINDOW_MS) return // duplicate
        lastCode = code
        lastAt = now
        haptics.tick() // a scan landed (HID or camera) — DESIGN.md capture tick
        onScan(code, fromCamera)
    }

    if (autofocus) {
        LaunchedEffect(Unit) {
            runCatching { focusRequester.requestFocus() }
            delay(HIDE_SETTLE_MS) // let the IME-show request land, then cancel it
            keyboard?.hide()
        }
    }

    AppTextField(
        value = text,
        onValueChange = { text = it },
        modifier = modifier
            .focusRequester(focusRequester)
            .onFocusChanged { if (it.isFocused && !userTapped) keyboard?.hide() },
        placeholder = placeholder,
        imeAction = ImeAction.Done,
        keyboardActions = KeyboardActions(onDone = { submit(text, fromCamera = false) }),
        showKeyboardOnFocus = false, // honoured by newer fields; the hide route covers the rest
        interactionSource = interactionSource,
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
                    submit(it, fromCamera = true)
                },
                permissionMessage = cameraPermissionMessage,
            )
        }
    }
}
