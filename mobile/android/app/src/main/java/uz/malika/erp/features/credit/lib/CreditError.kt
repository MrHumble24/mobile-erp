package uz.malika.erp.features.credit.lib

import uz.malika.erp.core.AppException

/**
 * Map a credit API failure to a `credit.*` i18n key (ADR 0035), mirroring the web
 * `credit-error.ts`. The server raises distinct 400 messages; we key off their
 * stable fragments. A 409 `NO_OPEN_SHIFT` is the shift gate, handled separately.
 * Anything else returns null so the caller shows the raw message.
 */
fun creditErrorKey(err: AppException): String? {
    if (err.statusCode != 400) return null
    val m = err.message.lowercase()
    return when {
        "must equal the cart total" in m -> "credit.errorPlanTotal"
        "in the past" in m -> "credit.errorPastDue"
        "limit" in m -> "credit.errorLimit"
        "disabled" in m || "switched off" in m || "turned off" in m -> "credit.errorDisabled"
        "exceeds the outstanding" in m -> "credit.errorAboveOutstanding"
        "phone" in m -> "credit.needsCustomer"
        else -> null
    }
}
