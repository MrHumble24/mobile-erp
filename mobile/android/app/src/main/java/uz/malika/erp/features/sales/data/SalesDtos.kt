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

/** `/sales/stats`. Money is a Decimal string; `netProfit` is redacted (nullable) for under-privileged callers. */
@Serializable
data class SaleStatsDto(
    val count: Int = 0,
    val revenue: String = "0",
    val avgPrice: String = "0",
    val returnedCount: Int = 0,
    val refundTotal: String = "0",
    val netProfit: String? = null,
)

/** `/users` — only the id + display name are needed for the cashier filter. */
@Serializable
data class UsersPageDto(val items: List<UserOptionDto> = emptyList(), val total: Int = 0)

@Serializable
data class UserOptionDto(val id: String = "", val email: String = "", val profile: UserProfileNameDto? = null)

@Serializable
data class UserProfileNameDto(val firstName: String = "", val lastName: String? = null)

@Serializable
data class SaleDto(
    val id: String = "",
    val device: SaleDeviceDto? = null, // null for a quantity sale (ADR 0030) or a vanished device row
    /** Set for a quantity sale: the product sold. */
    val model: ModelRefDto? = null,
    /** Pieces sold (quantity sale); null for a unit sale. */
    val quantity: Int? = null,
    val customer: SaleCustomerDto? = null,
    val salePrice: String = "0",
    val landedCostSnapshot: String? = null,
    val netProfit: String? = null,
    val soldAt: String? = null,
    val soldBy: SalePersonDto = SalePersonDto(),
    val warranty: WarrantyWindowDto? = null,
    val consignmentId: String? = null,
    /** The credit agreement this sale belongs to (ADR 0035); null for a paid sale. */
    val creditId: String? = null,
    val notes: String? = null,
    @SerialName("return") val returnInfo: SaleReturnDto? = null,
    /** How the sale was tendered; `[]` when none. Optional so older cached rows decode. */
    val payments: List<SalePaymentDto> = emptyList(),
    // Pricing (ADR 0034). Null for pre-feature sales or a line that had no list price.
    val listPrice: String? = null,
    val discountAmount: String? = null,
    val priceLevelCode: String? = null,
    /** Phones taken in part payment (ADR 0039); their values lower the amount paid. */
    val tradeIns: List<SaleTradeInDto> = emptyList(),
    /** Loyalty points earned and spent on this sale (ADR 0043). */
    val bonus: SaleBonusDto = SaleBonusDto(),
)

/** One tender line of a sale (its SALE ledger rows). `amount` is a decimal string. */
@Serializable
data class SalePaymentDto(val accountCode: String = "", val amount: String = "0")

/** A trade-in on a sale / receipt (ADR 0039). `value` is customer-facing (not redacted). */
@Serializable
data class SaleTradeInDto(
    val deviceId: String = "",
    val imei: String? = null,
    val serialNumber: String? = null,
    val model: ModelRefDto = ModelRefDto(),
    val value: String = "0",
)

@Serializable
data class SaleDeviceDto(
    val imei: String? = null,
    val imei2: String? = null,
    val serialNumber: String? = null,
    val model: ModelRefDto = ModelRefDto(),
    val specs: JsonElement? = null,
)

@Serializable
data class ModelRefDto(val brand: String = "", val name: String = "", val kindCode: String? = null)

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
    val imei: String? = null,
    val serialNumber: String? = null,
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
    /** Trade-ins taken in part payment (ADR 0039), for the printed receipt. */
    val tradeIns: List<SaleTradeInDto> = emptyList(),
    /** How the sale was tendered; `[]` when none. */
    val payments: List<SalePaymentDto> = emptyList(),
    /** Loyalty points earned and spent on this sale (ADR 0043). */
    val bonus: SaleBonusDto = SaleBonusDto(),
    /** Shop identity for the receipt header (ADR 0043). */
    val store: ReceiptStoreDto = ReceiptStoreDto(),
    /** Free-text receipt footer, or null. */
    val footer: String? = null,
)

@Serializable
data class ReceiptItemDto(
    val imei: String = "",
    val imei2: String? = null,
    val serialNumber: String? = null,
    val model: String = "",
    val storage: String? = null,
    val color: String? = null,
    /** Pieces, for a quantity sale; null for a unit sale (ADR 0030). */
    val quantity: Int? = null,
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
    val imei: String? = null,
    val imei2: String? = null,
    val serialNumber: String? = null,
    val version: Int = 0,
    val statusCode: String = "",
    val model: ModelRefDto = ModelRefDto(),
    val targetPrice: String? = null,
    /** Resolved list prices per level (ADR 0034): `{ RETAIL, WHOLESALE, PARTNER }`. */
    val prices: Map<String, String?>? = null,
)

// ── Scan + quantity products (ADR 0030) ───────────────────────────────────────

/** `GET /scan/:code`: a unit (today's behaviour) or a quantity product; 404 → neither. */
@Serializable
data class ScanResultDto(
    val kind: String = "",
    /** The unit when `kind == "unit"` (DeviceDetailView; lean decode via ignoreUnknownKeys). */
    val unit: DeviceByImeiDto? = null,
    /** The product when `kind == "product"`. */
    val product: QuantityProductDto? = null,
)

/**
 * A quantity product from `GET /scan/:code` or `GET /stock?search=` — only what
 * the till needs. Stock views carry more fields; the extra keys are ignored.
 */
@Serializable
data class QuantityProductDto(
    val modelId: String = "",
    val brand: String = "",
    val name: String = "",
    val barcode: String? = null,
    val salePrice: String? = null,
    val quantity: Int = 0,
    /** Resolved list prices per level (ADR 0034). */
    val prices: Map<String, String?>? = null,
)

/** The `latestSale` blob cached on a device row by `/sync/changes` (offline warranty). */
@Serializable
data class CachedSaleDto(
    val id: String = "",
    val soldAt: String? = null,
    val salePrice: String = "0",
    val warrantyEndsAt: String? = null,
)

// ── Request bodies (online writes) ─────────────────────────────────────────────
// Customer DTOs and their write bodies live in CustomerDtos.kt (file-size split).

@Serializable
data class ReturnBody(
    val refundAmount: Double,
    val deviceToStatusCode: String,
    val reason: String? = null,
)
