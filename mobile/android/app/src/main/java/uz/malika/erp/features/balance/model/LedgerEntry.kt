package uz.malika.erp.features.balance.model

/**
 * The manual ledger actions and their rules, so the UI never re-encodes the
 * sign logic:
 * - `DEPOSIT` / `WITHDRAWAL` take a **positive** amount (the server applies the
 *   direction).
 * - `OPENING` / `CORRECTION` take a **signed** amount (a minus takes money out).
 * - `CORRECTION` additionally needs a reason.
 */
enum class LedgerAction(val typeCode: String, val signed: Boolean, val needsReason: Boolean) {
    OPENING("OPENING", signed = true, needsReason = false),
    DEPOSIT("DEPOSIT", signed = false, needsReason = false),
    WITHDRAWAL("WITHDRAWAL", signed = false, needsReason = false),
    CORRECTION("CORRECTION", signed = true, needsReason = true),
}

/** Result of validating a manual-entry form; [Error.key] is an i18n key. */
sealed interface EntryCheck {
    data class Ok(val amount: Double) : EntryCheck
    data class Error(val key: String) : EntryCheck
}

/**
 * Validate a manual entry. Pure (no Android) so it is unit-tested directly.
 * Zero/blank is always rejected; an unsigned action also rejects a negative
 * amount; a correction rejects a blank reason.
 */
fun checkEntry(action: LedgerAction, amountText: String, note: String): EntryCheck {
    val amount = amountText.trim().toDoubleOrNull()
    if (amount == null || amount == 0.0) return EntryCheck.Error("balance.errorAmountRequired")
    if (!action.signed && amount < 0.0) return EntryCheck.Error("balance.errorAmountRequired")
    if (action.needsReason && note.isBlank()) return EntryCheck.Error("balance.errorReasonRequired")
    return EntryCheck.Ok(amount)
}

/** Result of validating a transfer form; [Error.key] is an i18n key. */
sealed interface TransferCheck {
    data class Ok(val amount: Double) : TransferCheck
    data class Error(val key: String) : TransferCheck
}

/** Validate a transfer: a positive amount between two different accounts. Pure. */
fun checkTransfer(from: String?, to: String?, amountText: String): TransferCheck {
    val amount = amountText.trim().toDoubleOrNull()
    if (amount == null || amount <= 0.0) return TransferCheck.Error("balance.errorAmountRequired")
    if (from == null || to == null || from == to) return TransferCheck.Error("balance.errorSameAccount")
    return TransferCheck.Ok(amount)
}
