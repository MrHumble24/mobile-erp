package uz.malika.erp.features.balance.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonPrimitive

/**
 * `/ledger` shapes. A balance (`balance`, `total`) arrives as a JSON number
 * today and as a decimal string after a server change in progress, so it is read
 * as a [JsonPrimitive] and exposed as the raw digits string — `parseMoney` turns
 * that into a BigDecimal and money is never a float. A transaction `amount` is
 * already a signed decimal string. These serializable shapes double as the
 * slice's domain types (the DTO→domain map would be the identity).
 */
@Serializable
data class LedgerAccount(
    val accountCode: String,
    val label: String = "",
    @SerialName("balance") private val balanceValue: JsonPrimitive = JsonPrimitive(0),
) {
    /** Raw digits, whether the server sent a number or a decimal string. */
    val balance: String get() = balanceValue.content
}

@Serializable
data class LedgerBalances(
    val accounts: List<LedgerAccount> = emptyList(),
    @SerialName("total") private val totalValue: JsonPrimitive = JsonPrimitive(0),
) {
    val total: String get() = totalValue.content
}

@Serializable
data class LedgerCodeRef(val code: String = "", val label: String = "")

@Serializable
data class LedgerProfileRef(val firstName: String? = null, val lastName: String? = null)

@Serializable
data class LedgerUserRef(
    val email: String = "",
    val profile: LedgerProfileRef? = null,
) {
    /** Full name when a profile exists, else the email. */
    val displayName: String
        get() = profile?.let { listOfNotNull(it.firstName, it.lastName).joinToString(" ").trim() }
            ?.ifBlank { email } ?: email
}

@Serializable
data class LedgerTxn(
    val id: String,
    val accountCode: String = "",
    val typeCode: String = "",
    val amount: String = "0",
    val occurredAt: String? = null,
    val note: String? = null,
    val transferId: String? = null,
    val createdAt: String? = null,
    val account: LedgerCodeRef? = null,
    val type: LedgerCodeRef? = null,
    val createdBy: LedgerUserRef? = null,
)

@Serializable
data class LedgerTxnPage(
    val items: List<LedgerTxn> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 50,
)

/**
 * `POST /ledger/transactions` body. `amount` is signed for `OPENING`/`CORRECTION`
 * and positive for `DEPOSIT`/`WITHDRAWAL`; the caller validates before sending.
 */
@Serializable
data class CreateLedgerTxnBody(
    val accountCode: String,
    val typeCode: String,
    val amount: Double,
    val note: String? = null,
    val occurredAt: String? = null,
)

/** `POST /ledger/transfers` body. `amount` positive; the two accounts must differ. */
@Serializable
data class CreateTransferBody(
    val fromAccountCode: String,
    val toAccountCode: String,
    val amount: Double,
    val note: String? = null,
)

/** The history filter: client state and the query params it maps to. */
data class LedgerFilter(
    val accountCode: String? = null,
    val typeCode: String? = null,
    val fromIso: String? = null,
    val toIso: String? = null,
)
