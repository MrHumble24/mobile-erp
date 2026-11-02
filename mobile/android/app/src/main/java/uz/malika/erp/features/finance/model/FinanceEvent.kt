package uz.malika.erp.features.finance.model

/**
 * One-shot user feedback from a ViewModel to its screen (snackbar). [Message]
 * carries an i18n key the screen resolves through `t()`; [Failure] carries an
 * already-human message (a normalized server/network error).
 */
sealed interface FinanceEvent {
    data class Message(val key: String) : FinanceEvent
    data class Failure(val text: String) : FinanceEvent
}
