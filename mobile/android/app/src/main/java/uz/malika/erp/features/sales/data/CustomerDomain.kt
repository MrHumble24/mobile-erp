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
)

fun CustomerDto.toDomain() = Customer(id = id, name = name, phone = phone, notes = notes)

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
) {
    fun toCustomer() = Customer(id = id, name = name, phone = phone, notes = notes)
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
)

/** One row of a customer's purchase history (`GET /customers/:id/sales`). */
data class CustomerSale(
    val id: String,
    val imei: String,
    val modelLabel: String,
    val salePrice: String,
    val soldAt: String?,
)

fun SaleDto.toCustomerSale() = CustomerSale(
    id = id,
    imei = device.imei,
    modelLabel = "${device.model.brand} ${device.model.name}".trim(),
    salePrice = salePrice,
    soldAt = soldAt,
)
