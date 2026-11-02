package uz.malika.erp.features.admin.ui

import androidx.compose.runtime.Composable
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading

/** Renders an [Async] read with the Caldera loading / error / content states. */
@Composable
fun <T> AsyncContent(
    state: Async<T>,
    onRetry: (() -> Unit)? = null,
    content: @Composable (T) -> Unit,
) {
    val t = LocalT.current
    when (state) {
        Async.Loading -> Loading()
        is Async.Fail -> ErrorView(
            message = state.message,
            retryLabel = if (onRetry != null) t("common.retry", null) else null,
            onRetry = onRetry,
        )
        is Async.Ok -> content(state.value)
    }
}
