package uz.malika.erp.features.sales.data

/**
 * Customer models. `/customers` has no offline feed — every read and write is
 * online. There is no `customers` i18n namespace loaded, so the UI labels with
 * `sales.*` / `common.*` keys.
 */
data class Customer(
    val id: String,
    val name: String,
    val phone: String?,
    val notes: String?,
    /** Pricing (ADR 0034): the customer's price level + standing discount percent. */
    val priceLevelCode: String = "RETAIL",
    val standingDiscountPercent: String = "0",
    /** The customer's own credit ceiling (2-dp string); null = use the shop default (ADR 0035). */
    val creditLimit: String? = null,
)

fun CustomerDto.toDomain() = Customer(
    id = id, name = name, phone = phone, notes = notes,
    priceLevelCode = priceLevelCode, standingDiscountPercent = standingDiscountPercent,
    creditLimit = creditLimit,
)

/** A customer plus purchase aggregates derived server-side (not stored). */
data class CustomerListItem(
    val id: String,
    val name: String,
    val phone: String?,
    val notes: String?,
    val purchaseCount: Int,
    val totalSpent: Double,
    val activeWarranties: Int,
    val returnsCount: Int,
    val priceLevelCode: String = "RETAIL",
    val standingDiscountPercent: String = "0",
    /** Credit position (ADR 0035), all derived server-side. */
    val creditLimit: String? = null,
    val creditOutstanding: String = "0",
    val creditOverdue: String = "0",
    val effectiveCreditLimit: String? = null,
) {
    fun toCustomer() = Customer(
        id = id, name = name, phone = phone, notes = notes,
        priceLevelCode = priceLevelCode, standingDiscountPercent = standingDiscountPercent,
        creditLimit = creditLimit,
    )
}

fun CustomerListItemDto.toDomain() = CustomerListItem(
    id = id,
    name = name,
    phone = phone,
    notes = notes,
    purchaseCount = purchaseCount,
    totalSpent = totalSpent,
    activeWarranties = activeWarranties,
    returnsCount = returnsCount,
    priceLevelCode = priceLevelCode,
    standingDiscountPercent = standingDiscountPercent,
    creditLimit = creditLimit,
    creditOutstanding = creditOutstanding,
    creditOverdue = creditOverdue,
    effectiveCreditLimit = effectiveCreditLimit,
)

/** Aggregate tiles for the customer directory (`GET /customers/stats`). */
data class CustomerStats(
    val total: Int,
    val newThisMonth: Int,
    val withPurchases: Int,
    val repeatBuyers: Int,
)

fun CustomerStatsDto.toDomain() = CustomerStats(
    total = total,
    newThisMonth = newThisMonth,
    withPurchases = withPurchases,
    repeatBuyers = repeatBuyers,
)

/** One row of a customer's purchase history (`GET /customers/:id/sales`). */
data class CustomerSale(
    val id: String,
    val code: String,
    val modelLabel: String,
    val salePrice: String,
    val soldAt: String?,
)

fun SaleDto.toCustomerSale() = CustomerSale(
    id = id,
    code = uz.malika.erp.shared.lib.UnitCode.display(device?.imei, device?.serialNumber),
    modelLabel = device?.let { "${it.model.brand} ${it.model.name}".trim() } ?: "",
    salePrice = salePrice,
    soldAt = soldAt,
)
