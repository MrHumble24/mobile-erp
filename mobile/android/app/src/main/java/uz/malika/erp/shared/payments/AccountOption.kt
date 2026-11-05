package uz.malika.erp.shared.payments

/**
 * A money account the user can pick (CASH, CARD, …). [label] is the server's own
 * label for an account the UI does not know; CASH/CARD resolve to an i18n key
 * instead (see [accountLabelKey]).
 */
data class AccountOption(val code: String, val label: String = "") {
    companion object {
        /** The two known codes, used when the caller lacks `balance.read`. */
        val FALLBACK: List<AccountOption> = listOf(AccountOption("CASH"), AccountOption("CARD"))
    }
}

/** The i18n key for a known account code, or null to fall back to the server label. */
fun accountLabelKey(code: String): String? = when (code) {
    "CASH" -> "balance.accountCash"
    "CARD" -> "balance.accountCard"
    else -> null
}

/** CASH then CARD then the rest, so a split pays cash before card. */
fun List<AccountOption>.canonicalOrder(): List<AccountOption> {
    val rank = { o: AccountOption -> when (o.code) { "CASH" -> 0; "CARD" -> 1; else -> 2 } }
    return sortedBy(rank)
}
