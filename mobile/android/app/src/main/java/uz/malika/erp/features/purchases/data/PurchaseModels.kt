package uz.malika.erp.features.purchases.data

import kotlinx.serialization.Serializable

/**
 * Buying a used phone from a customer (Change 14, ADR 0039). Transport shapes
 * for `/customer-purchases`. Money is a 2-dp string; `pricePaid` is REDACTED
 * (absent) without `device.cost.view`, so it is nullable here. A plain buy has
 * an `accountCode` and no `saleId`; a trade-in has a `saleId` and no account.
 */

@Serializable
data class PurchaseModelRef(
    val id: String = "",
    val brand: String = "",
    val name: String = "",
    val kindCode: String = "IMEI",
) {
    val label: String get() = "$brand $name".trim()
}

@Serializable
data class PurchaseUnitDto(
    val deviceId: String = "",
    val imei: String? = null,
    val imei2: String? = null,
    val serialNumber: String? = null,
    val model: PurchaseModelRef = PurchaseModelRef(),
)

@Serializable
data class PurchaseCustomerDto(val id: String = "", val name: String = "", val phone: String? = null)

@Serializable
data class PurchasePersonDto(val id: String = "", val name: String = "")

@Serializable
data class CustomerPurchaseDto(
    val id: String = "",
    val customer: PurchaseCustomerDto = PurchaseCustomerDto(),
    val unit: PurchaseUnitDto = PurchaseUnitDto(),
    /** Redacted (absent) without `device.cost.view`. */
    val pricePaid: String? = null,
    /** The account the money left from; null for a trade-in. */
    val accountCode: String? = null,
    /** The sale this was a trade-in on; null for a plain purchase. */
    val saleId: String? = null,
    val soldBy: PurchasePersonDto = PurchasePersonDto(),
    val occurredAt: String = "",
) {
    /** The unit's identifier — IMEI or serial number (ADR 0029). */
    val code: String get() = imeiOrSerial()

    private fun imeiOrSerial(): String =
        unit.imei?.takeIf { it.isNotBlank() } ?: unit.serialNumber?.takeIf { it.isNotBlank() } ?: ""
}

@Serializable
data class CustomerPurchasePageDto(
    val items: List<CustomerPurchaseDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20,
)
