package uz.malika.erp.features.sales.lib

/**
 * Maps a server error code to the i18n key the till shows for a rejected
 * checkout (trade-in or bonus), ADR 0039/0043. Anything unknown → null so the
 * caller falls back to the server's message.
 */
fun checkoutErrorKey(code: String?): String? {
    return when {
        code == "BONUS_DISABLED" -> "pos.bonusErrorDisabled"
        code == "BONUS_NO_CUSTOMER" -> "pos.bonusErrorNoCustomer"
        code == "BONUS_REDEEM_EXCEEDS_BALANCE" -> "pos.bonusErrorExceedsBalance"
        code == "BONUS_REDEEM_EXCEEDS_MAX" -> "pos.bonusErrorExceedsMax"
        code == "BONUS_REDEEM_EXCEEDS_DUE" -> "pos.bonusErrorExceedsDue"
        code == "BONUS_REDEEM_OFFLINE" -> "pos.bonusErrorOffline"
        code == "TRADE_IN_FORBIDDEN" -> "pos.tradeInErrorForbidden"
        code == "TRADE_IN_NO_CUSTOMER" -> "pos.tradeInErrorNoCustomer"
        code == "TRADE_IN_OFFLINE" -> "pos.tradeInErrorOffline"
        code == "TRADE_IN_EXCEEDS_SALE" -> "pos.tradeInErrorExceedsSale"
        code == "PURCHASE_UNIT_EXISTS" -> "purchases.buyNotSold"
        else -> null
    }
}
