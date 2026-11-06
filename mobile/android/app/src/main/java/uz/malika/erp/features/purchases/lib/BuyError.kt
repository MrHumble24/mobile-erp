package uz.malika.erp.features.purchases.lib

/**
 * The i18n key for a buy-a-phone failure (`POST /customer-purchases`, ADR
 * 0044). A unit that is already ours and is not SOLD gets its own translated
 * refusal; any other 409 keeps the existing buy-conflict text; anything else
 * (400, network …) gets null so the caller shows the server's message. The
 * `NO_OPEN_SHIFT` shift gate stays in the view model.
 */
fun buyErrorKey(statusCode: Int, code: String?): String? = when {
    statusCode == 409 && code == "PURCHASE_UNIT_EXISTS" -> "purchases.buyNotSold"
    statusCode == 409 -> "purchases.buyConflict"
    else -> null
}
