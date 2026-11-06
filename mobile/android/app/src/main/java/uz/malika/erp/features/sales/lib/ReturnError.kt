package uz.malika.erp.features.sales.lib

/**
 * Server return refusals that carry their own message (ADR 0044). Anything
 * else returns null so the caller falls back to the server's message.
 */
fun returnErrorKey(code: String?): String? = when (code) {
    "SALE_UNIT_BOUGHT_BACK" -> "sales.returnBoughtBack"
    "TRADE_IN_REFUND_FORBIDDEN" -> "sales.returnTradeInForbidden"
    else -> null
}
