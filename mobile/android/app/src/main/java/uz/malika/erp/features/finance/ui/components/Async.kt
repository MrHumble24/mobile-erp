package uz.malika.erp.features.finance.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.core.AppException
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.ui.theme.Tokens

/** Loading / Error / Data of an async read — the Compose analogue of the web `useQuery` states. */
sealed interface Async<out T> {
    data object Loading : Async<Nothing>
    data class Error(val message: String) : Async<Nothing>
    data class Data<T>(val value: T) : Async<T>
}

class AsyncHandle<T>(val state: Async<T>, val reload: () -> Unit)

/**
 * Runs [block] whenever any of [keys] change (or [AsyncHandle.reload] fires)
 * and exposes its Loading/Error/Data state. Errors are normalized to a message.
 */
@Composable
fun <T> rememberAsync(vararg keys: Any?, block: suspend () -> T): AsyncHandle<T> {
    var tick by remember { mutableIntStateOf(0) }
    val state by produceState<Async<T>>(Async.Loading, *keys, tick) {
        value = Async.Loading
        value = runCatching { block() }.fold(
            onSuccess = { Async.Data(it) },
            onFailure = { Async.Error((it as? AppException)?.message ?: it.message ?: "Error") },
        )
    }
    return AsyncHandle(state) { tick++ }
}

/** Renders [content] for Data; otherwise a spinner or an [ErrorView] with retry. */
@Composable
fun <T> AsyncContent(
    handle: AsyncHandle<T>,
    retryLabel: String? = null,
    content: @Composable (T) -> Unit,
) {
    when (val s = handle.state) {
        is Async.Loading -> Box(
            Modifier.fillMaxWidth().height(180.dp),
            contentAlignment = Alignment.Center,
        ) { CircularProgressIndicator(color = Tokens.primary) }

        is Async.Error -> Box(Modifier.fillMaxWidth().padding(16.dp)) {
            ErrorView(
                message = s.message,
                retryLabel = retryLabel,
                onRetry = if (retryLabel != null) handle.reload else null,
            )
        }

        is Async.Data -> content(s.value)
    }
}
