package uz.malika.erp.shared.lib

import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalView

/**
 * The one haptic vocabulary (DESIGN.md Motion & Haptics): `tick` = a scan landed,
 * `success` = a sale/batch completed, `error` = a duplicate or rejected scan.
 * Built on `View.performHapticFeedback`, which already honours the system haptic
 * setting. CONFIRM / REJECT are API 30+; below that we fall back to KEYBOARD_TAP /
 * LONG_PRESS. `success` is two CONFIRM pulses 120 ms apart.
 */
object Haptics {
    private val confirm =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM
        else HapticFeedbackConstants.KEYBOARD_TAP
    private val reject =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.REJECT
        else HapticFeedbackConstants.LONG_PRESS

    fun tick(view: View) {
        view.performHapticFeedback(confirm)
    }

    fun success(view: View) {
        view.performHapticFeedback(confirm)
        view.postDelayed({ view.performHapticFeedback(confirm) }, 120)
    }

    fun error(view: View) {
        view.performHapticFeedback(reject)
    }
}

/** View-bound haptics for a composable: `val h = rememberHaptics(); h.tick()`. */
class HapticsController(private val view: View) {
    fun tick() = Haptics.tick(view)
    fun success() = Haptics.success(view)
    fun error() = Haptics.error(view)
}

@Composable
fun rememberHaptics(): HapticsController {
    val view = LocalView.current
    return remember(view) { HapticsController(view) }
}
