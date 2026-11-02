package uz.malika.erp.features.sales.data

/** Sale channel is DERIVED from `consignmentId` (never a stored column). */
enum class SaleChannel { RETAIL, B2B }

/** One completed sale for the list + detail sheet. Cost/profit are nullable (redacted). */
data class Sale(
    val id: String,
    val imei: String,
    val modelLabel: String,
    val customerName: String?,
    val salePrice: String,
    val netProfit: String?,
    val soldAt: String?,
    val soldByName: String,
    val warrantyDays: Int?,
    val consignmentId: String?,
    val returnedAt: String?,
) {
    val channel: SaleChannel get() = if (consignmentId != null) SaleChannel.B2B else SaleChannel.RETAIL
}

fun SaleDto.toDomain() = Sale(
    id = id,
    imei = device.imei,
    modelLabel = "${device.model.brand} ${device.model.name}".trim(),
    customerName = customer?.name,
    salePrice = salePrice,
    netProfit = netProfit,
    soldAt = soldAt,
    soldByName = soldBy.name,
    warrantyDays = warranty?.days,
    consignmentId = consignmentId,
    returnedAt = returnInfo?.returnedAt,
)

/** Warranty status for a returning customer, keyed by IMEI. Built online or offline. */
data class Warranty(
    val imei: String,
    val saleId: String,
    val salePrice: String,
    val remainingDays: Int,
    val hasWarranty: Boolean,
    val grade: String?,
    val notes: String?,
    val alreadyReturned: Boolean,
) {
    val active: Boolean get() = hasWarranty && remainingDays > 0
}

fun WarrantyDto.toDomain() = Warranty(
    imei = imei,
    saleId = saleId,
    salePrice = salePrice,
    remainingDays = remainingDays,
    hasWarranty = warranty != null,
    grade = latestInspection?.grade,
    notes = latestInspection?.notes,
    alreadyReturned = alreadyReturned,
)
