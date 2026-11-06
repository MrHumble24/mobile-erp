package uz.malika.erp.features.sales.data

import kotlinx.serialization.Serializable

/** Loyalty points earned and spent on a sale (ADR 0043), as Decimal strings. */
@Serializable
data class SaleBonusDto(val earned: String = "0", val spent: String = "0")

/** The shop identity printed on a receipt (ADR 0043); each field may be absent. */
@Serializable
data class ReceiptStoreDto(
    val name: String? = null,
    val address: String? = null,
    val phone: String? = null,
)
