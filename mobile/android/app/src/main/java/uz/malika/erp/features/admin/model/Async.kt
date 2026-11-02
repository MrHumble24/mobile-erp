package uz.malika.erp.features.admin.model

import uz.malika.erp.core.AppException

/** Minimal load state for a single async read: loading / failed / loaded. */
sealed interface Async<out T> {
    data object Loading : Async<Nothing>
    data class Fail(val message: String) : Async<Nothing>
    data class Ok<T>(val value: T) : Async<T>
}

/** Run [block] and fold success/failure into an [Async], unwrapping AppException. */
suspend fun <T> asyncOf(block: suspend () -> T): Async<T> = try {
    Async.Ok(block())
} catch (e: AppException) {
    Async.Fail(e.message)
} catch (e: Exception) {
    Async.Fail(e.message ?: "error")
}
