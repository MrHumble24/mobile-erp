package uz.malika.erp.features.inventory.model

/** A one-shot online read's state (mirrors the web client's query states). */
sealed interface Async<out T> {
    data object Loading : Async<Nothing>
    data class Error(val message: String) : Async<Nothing>
    data class Data<T>(val value: T) : Async<T>

    val valueOrNull: T? get() = (this as? Data)?.value
}
