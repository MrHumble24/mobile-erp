package uz.malika.erp.features.sales.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Transport shapes for the sales/customers endpoints. Money is a Decimal string
 * from the server; cost fields (`landedCostSnapshot`, `netProfit`) are REDACTED
 * for under-privileged users so they arrive absent and stay nullable here.
 */

// ── Sales ─────────────────────────────────────────────────────────────────────

@Serializable
data class SalesPageDto(val items: List<SaleDto> = emptyList(), val total: Int = 0)

@Serializable
data class SaleDto(
    val id: String = "",
    val device: SaleDeviceDto = SaleDeviceDto(),
    val customer: SaleCustomerDto? = null,
    val salePrice: String = "0",
    val landedCostSnapshot: String? = null,
    val netProfit: String? = null,
    val soldAt: String? = null,
    val soldBy: SalePersonDto = SalePersonDto(),
    val warranty: WarrantyWindowDto? = null,
    val consignmentId: String? = null,
    val notes: String? = null,
    @SerialName("return") val returnInfo: SaleReturnDto? = null,
)

@Serializable
data class SaleDeviceDto(
    val imei: String = "",
    val model: ModelRefDto = ModelRefDto(),
    val specs: JsonElement? = null,
)

@Serializable
data class ModelRefDto(val brand: String = "", val name: String = "")

@Serializable
data class SaleCustomerDto(val id: String = "", val name: String = "", val phone: String? = null)

@Serializable
data class SalePersonDto(val id: String = "", val name: String = "")

@Serializable
data class WarrantyWindowDto(val days: Int = 0, val startsAt: String? = null, val endsAt: String? = null)

@Serializable
data class SaleReturnDto(
    val returnedAt: String? = null,
    val refundAmount: String? = null,
    val reason: String? = null,
    val processedBy: SalePersonDto = SalePersonDto(),
)

// ── Warranty lookup ───────────────────────────────────────────────────────────

@Serializable
data class WarrantyDto(
    val imei: String = "",
    val saleId: String = "",
    val purchasedAt: String? = null,
    val salePrice: String = "0",
    val warranty: WarrantyWindowDto? = null,
    val remainingDays: Int = 0,
    val latestInspection: InspectionGradeDto? = null,
    val alreadyReturned: Boolean = false,
)

@Serializable
data class InspectionGradeDto(val grade: String? = null, val notes: String? = null)

// ── Receipt ─────────────────────────────────────────────────────────────────

@Serializable
data class ReceiptDto(
    val saleId: String = "",
    val soldAt: String? = null,
    val cashier: String = "",
    val items: List<ReceiptItemDto> = emptyList(),
    val total: String = "0",
    val warranty: ReceiptWarrantyDto? = null,
    val customer: ReceiptCustomerDto? = null,
)

@Serializable
data class ReceiptItemDto(
    val imei: String = "",
    val model: String = "",
    val storage: String? = null,
    val color: String? = null,
    val price: String = "0",
)

@Serializable
data class ReceiptWarrantyDto(val days: Int = 0, val endsAt: String? = null)

@Serializable
data class ReceiptCustomerDto(val name: String = "", val phone: String? = null)

// ── Device by IMEI (POS online fallback) ──────────────────────────────────────

@Serializable
data class DeviceByImeiDto(
    val id: String = "",
    val imei: String = "",
    val version: Int = 0,
    val statusCode: String = "",
    val model: ModelRefDto = ModelRefDto(),
    val targetPrice: String? = null,
)

@Serializable
data class SettingsDto(val defaultWarrantyDays: Int = 0)

/** The `latestSale` blob cached on a device row by `/sync/changes` (offline warranty). */
@Serializable
data class CachedSaleDto(
    val id: String = "",
    val soldAt: String? = null,
    val salePrice: String = "0",
    val warrantyEndsAt: String? = null,
)

// ── Customers ─────────────────────────────────────────────────────────────────

@Serializable
data class CustomerDto(
    val id: String = "",
    val name: String = "",
    val phone: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class CustomerPageDto(
    val items: List<CustomerListItemDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20,
)

@Serializable
data class CustomerListItemDto(
    val id: String = "",
    val name: String = "",
    val phone: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val purchaseCount: Int = 0,
    val totalSpent: Double = 0.0,
    val lastPurchaseAt: String? = null,
    val activeWarranties: Int = 0,
    val returnsCount: Int = 0,
)

// ── Request bodies (online writes) ─────────────────────────────────────────────

@Serializable
data class ReturnBody(
    val refundAmount: Double,
    val deviceToStatusCode: String,
    val reason: String? = null,
)

@Serializable
data class CreateCustomerBody(val name: String, val phone: String? = null, val notes: String? = null)

@Serializable
data class UpdateCustomerBody(val name: String? = null, val phone: String? = null, val notes: String? = null)
