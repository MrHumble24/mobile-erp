package uz.malika.erp.features.sales.data

import kotlinx.serialization.Serializable

/**
 * Bonus points (ADR 0043). Amounts arrive from the server as Decimal strings and
 * stay strings here — the UI formats them with [formatPoints].
 */
@Serializable
data class CustomerBonusDto(
    val customerId: String = "",
    val enabled: Boolean = false,
    val earnPercent: String = "0",
    val maxRedeemPercent: String = "0",
    val balance: String = "0",
    val history: List<BonusHistoryRowDto> = emptyList(),
)

@Serializable
data class BonusHistoryRowDto(
    val id: String = "",
    val typeCode: String = "",
    val amount: String = "0",
    val occurredAt: String? = null,
    val note: String? = null,
    val saleId: String? = null,
    val createdBy: BonusActor? = null,
)

@Serializable
data class BonusActor(val id: String = "", val name: String = "")

/** `POST /customers/:id/bonus/adjustments` request body. */
@Serializable
data class AdjustBonusBody(val amount: Double, val reason: String)
