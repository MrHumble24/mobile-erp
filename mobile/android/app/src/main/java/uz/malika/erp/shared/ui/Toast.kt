package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import uz.malika.erp.ui.theme.Tokens

/** Toast severity → Caldera surface color. */
enum class ToastKind { SUCCESS, ERROR, INFO }

data class Toast(val message: String, val kind: ToastKind)

/**
 * App-wide toast bus. One instance on `AppContainer`; call it from any ViewModel
 * or screen (`container.toaster.success(t("..."))`). [ToastHost] renders the
 * queue. Messages are already-translated strings — the bus is presentation-free.
 */
class Toaster {
    private val _toasts = MutableSharedFlow<Toast>(extraBufferCapacity = 8)
    val toasts: SharedFlow<Toast> = _toasts

    fun success(message: String) = emit(message, ToastKind.SUCCESS)
    fun error(message: String) = emit(message, ToastKind.ERROR)
    fun info(message: String) = emit(message, ToastKind.INFO)

    private fun emit(message: String, kind: ToastKind) {
        _toasts.tryEmit(Toast(message, kind))
    }
}

/**
 * Caldera-styled snackbar host. Mount once at the app root, fed the container's
 * [Toaster.toasts]. Snackbars queue (each [SnackbarHostState.showSnackbar]
 * suspends until the previous dismisses), so the per-kind color is set just
 * before each is shown.
 */
@Composable
fun ToastHost(toasts: SharedFlow<Toast>, modifier: Modifier = Modifier) {
    val hostState = remember { SnackbarHostState() }
    var kind by remember { mutableStateOf(ToastKind.INFO) }

    androidx.compose.runtime.LaunchedEffect(toasts) {
        toasts.collect { toast ->
            kind = toast.kind
            hostState.showSnackbar(toast.message)
        }
    }

    SnackbarHost(hostState, modifier) { data ->
        val container = when (kind) {
            ToastKind.SUCCESS -> Tokens.successBg
            ToastKind.ERROR -> Tokens.dangerBg
            ToastKind.INFO -> Tokens.infoBg
        }
        val content = when (kind) {
            ToastKind.SUCCESS -> Tokens.success
            ToastKind.ERROR -> Tokens.danger
            ToastKind.INFO -> Tokens.info
        }
        Snackbar(
            modifier = Modifier.padding(Tokens.Space.md),
            shape = RoundedCornerShape(Tokens.Radius.buttons),
            containerColor = container,
            contentColor = content,
        ) { Text(data.visuals.message) }
    }
}
