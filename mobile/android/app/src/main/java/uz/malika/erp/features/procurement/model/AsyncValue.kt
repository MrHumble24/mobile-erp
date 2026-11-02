package uz.malika.erp.features.procurement.model

import androidx.compose.runtime.Composable
import androidx.compose.runtime.produceState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading

/**
 * A minimal async-read state (the Compose equivalent of the web's React-Query
 * read, or the Flutter `AsyncValue`). Screens hold these in a ViewModel and
 * refresh on demand; transient sheets use [rememberAsync].
 */
sealed interface AsyncValue<out T> {
    data object Loading : AsyncValue<Nothing>
    data class Error(val message: String) : AsyncValue<Nothing>
    data class Data<T>(val value: T) : AsyncValue<T>
}

/** Launch [block] and publish Loading → Data/Error into this flow. */
fun <T> MutableStateFlow<AsyncValue<T>>.reload(scope: CoroutineScope, block: suspend () -> T) {
    value = AsyncValue.Loading
    scope.launch {
        value = try {
            AsyncValue.Data(block())
        } catch (e: AppException) {
            AsyncValue.Error(e.message)
        }
    }
}

/** One-shot read for a bottom sheet, keyed so it refetches when [key] changes. */
@Composable
fun <T> rememberAsync(key: Any?, block: suspend () -> T): AsyncValue<T> =
    produceState<AsyncValue<T>>(AsyncValue.Loading, key) {
        value = try {
            AsyncValue.Data(block())
        } catch (e: AppException) {
            AsyncValue.Error(e.message)
        }
    }.value

/** Renders the kit Loading/Error/Data states; [onRetry] shows a retry button. */
@Composable
fun <T> AsyncContent(
    state: AsyncValue<T>,
    onRetry: (() -> Unit)? = null,
    content: @Composable (T) -> Unit,
) {
    val t = LocalT.current
    when (state) {
        is AsyncValue.Loading -> Loading()
        is AsyncValue.Error -> ErrorView(
            message = state.message,
            retryLabel = if (onRetry != null) t("common.retry", null) else null,
            onRetry = onRetry,
        )
        is AsyncValue.Data -> content(state.value)
    }
}
