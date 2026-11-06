package uz.malika.erp.features.sales.data

import kotlinx.serialization.Serializable

/**
 * Transport shapes for the `/customers` endpoints (split out of SalesDtos to keep
 * each file under the size limit). Credit fields (ADR 0035) ride the list/detail
 * projections; everything is online — `/customers` has no offline feed.
 */

@Serializable
data class CustomerDto(
    val id: String = "",
    val name: String = "",
    val phone: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    /** Pricing (ADR 0034): the customer's price level and standing discount. */
    val priceLevelCode: String = "RETAIL",
    val standingDiscountPercent: String = "0",
    /** This customer's own credit ceiling (2-dp string); null = use the default (ADR 0035). */
    val creditLimit: String? = null,
    /** Bonus-points balance (a Decimal string); null when bonus is off for the store/customer. */
    val bonusBalance: String? = null,
)

/** `/customers/stats` aggregate tiles. */
@Serializable
data class CustomerStatsDto(
    val total: Int = 0,
    val newThisMonth: Int = 0,
    val withPurchases: Int = 0,
    val repeatBuyers: Int = 0,
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
    val priceLevelCode: String = "RETAIL",
    val standingDiscountPercent: String = "0",
    /** Credit position (ADR 0035): all derived server-side, never stored. */
    val creditLimit: String? = null,
    val creditOutstanding: String = "0",
    val creditOverdue: String = "0",
    /** The limit actually enforced (own else default); null = no cap. */
    val effectiveCreditLimit: String? = null,
)

@Serializable
data class CreateCustomerBody(
    val name: String,
    val phone: String? = null,
    val notes: String? = null,
    val priceLevelCode: String? = null,
    val standingDiscountPercent: Double? = null,
    val creditLimit: Double? = null,
)

@Serializable
data class UpdateCustomerBody(
    val name: String? = null,
    val phone: String? = null,
    val notes: String? = null,
    val priceLevelCode: String? = null,
    val standingDiscountPercent: Double? = null,
    val creditLimit: Double? = null,
)
