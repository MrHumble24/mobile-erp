package uz.malika.erp.features.procurement.model

import androidx.compose.runtime.Composable
import androidx.compose.runtime.produceState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
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

/** Map the value of a [AsyncValue.Data], passing Loading/Error through unchanged. */
inline fun <T, R> AsyncValue<T>.mapData(transform: (T) -> R): AsyncValue<R> = when (this) {
    is AsyncValue.Data -> AsyncValue.Data(transform(value))
    is AsyncValue.Error -> this
    AsyncValue.Loading -> AsyncValue.Loading
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

/**
 * A paginated server read ({@code { items, total }}) held as [AsyncValue] of a
 * [PageState]. [reloadPaged] fetches page 1 fresh; [loadMore] appends the next
 * page in place (the first/last states stay `Data`, so only the footer spinner
 * toggles via `PageState.loading`). [fetch] returns `items to total`.
 */
fun <T> MutableStateFlow<AsyncValue<PageState<T>>>.reloadPaged(
    scope: CoroutineScope,
    fetch: suspend (Int) -> Pair<List<T>, Int>,
) = reload(scope) { val (items, total) = fetch(1); PageState<T>().append(items, total, 1) }

fun <T> MutableStateFlow<AsyncValue<PageState<T>>>.loadMore(
    scope: CoroutineScope,
    fetch: suspend (Int) -> Pair<List<T>, Int>,
) {
    val cur = (value as? AsyncValue.Data)?.value ?: return
    if (cur.loading || !cur.hasMore) return
    val next = cur.nextPage
    value = AsyncValue.Data(cur.copy(loading = true))
    scope.launch {
        value = try {
            val (items, total) = fetch(next)
            AsyncValue.Data(cur.append(items, total, next))
        } catch (_: AppException) {
            AsyncValue.Data(cur.copy(loading = false))
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
