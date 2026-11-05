package uz.malika.erp.features.balance.model

/**
 * Server type/account codes → i18n keys. The caller falls back to the server's
 * own `label` for a code not listed here, so a new server type renders without a
 * client change.
 */
fun ledgerTypeKey(code: String): String? = when (code) {
    "OPENING" -> "balance.typeOpening"
    "DEPOSIT" -> "balance.typeDeposit"
    "WITHDRAWAL" -> "balance.typeWithdrawal"
    "CORRECTION" -> "balance.typeCorrection"
    "TRANSFER" -> "balance.typeTransfer"
    "SALE" -> "balance.typeSale"
    "REFUND" -> "balance.typeRefund"
    "PARTNER_PAYMENT" -> "balance.typePartnerPayment"
    "PURCHASE" -> "balance.typePurchase"
    "OVERHEAD" -> "balance.typeOverhead"
    "EXPENSE" -> "balance.typeExpense"
    else -> null
}

fun ledgerAccountKey(code: String): String? = when (code) {
    "CASH" -> "balance.accountCash"
    "CARD" -> "balance.accountCard"
    else -> null
}

/** Type codes offered in the history filter (manual + automatic sets). */
val LEDGER_FILTER_TYPES: List<String> = listOf(
    "OPENING", "DEPOSIT", "WITHDRAWAL", "CORRECTION", "TRANSFER",
    "SALE", "REFUND", "PARTNER_PAYMENT", "PURCHASE", "OVERHEAD", "EXPENSE",
)
