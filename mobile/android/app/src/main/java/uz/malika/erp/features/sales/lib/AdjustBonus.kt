package uz.malika.erp.features.sales.lib

/**
 * Pure validation for a manual bonus correction (`POST /customers/:id/bonus/adjustments`).
 * Returns the first failing i18n key, or `null` when the input is acceptable.
 */
fun adjustBonusError(amount: String, reason: String): String? {
    val a = amount.trim()
    if (a.isEmpty()) return "customers.bonusErrAmountRequired"
    if (!Regex("^-?\\d+(\\.\\d{1,2})?$").matches(a)) return "customers.bonusErrAmountFormat"
    if (a.toDoubleOrNull()?.let { it == 0.0 } == true) return "customers.bonusErrAmountZero"
    val r = reason.trim()
    if (r.isBlank()) return "customers.bonusErrReasonRequired"
    if (r.length > 500) return "customers.bonusErrReasonTooLong"
    return null
}
