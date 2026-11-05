package uz.malika.erp.features.sales.data

import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.lib.parseMoney

/** Sale channel is DERIVED from `consignmentId` (never a stored column). */
enum class SaleChannel { RETAIL, B2B }

/** One completed sale for the list + detail sheet. Cost/profit are nullable (redacted). */
data class Sale(
    val id: String,
    val imei: String?,
    val imei2: String? = null,
    val serialNumber: String? = null,
    val modelLabel: String,
    /** Pieces sold (quantity sale, ADR 0030); null for a unit sale. */
    val quantity: Int? = null,
    val customerName: String?,
    val customerPhone: String?,
    val salePrice: String,
    val netProfit: String?,
    val soldAt: String?,
    val soldByName: String,
    val warrantyDays: Int?,
    val consignmentId: String?,
    /** Set when this sale belongs to a credit agreement (ADR 0035). */
    val creditId: String? = null,
    val returnedAt: String?,
    val payments: List<AccountAmount> = emptyList(),
    // Pricing (ADR 0034). Null for pre-feature sales / a line that had no list price.
    val listPrice: String? = null,
    val discountAmount: String? = null,
    val priceLevelCode: String? = null,
) {
    val channel: SaleChannel get() = if (consignmentId != null) SaleChannel.B2B else SaleChannel.RETAIL

    /** Show the pricing breakdown only when there was a discount or a non-retail level. */
    val showPricing: Boolean
        get() = (discountAmount?.let { parseMoney(it).signum() > 0 } == true) ||
            (priceLevelCode != null && priceLevelCode != "RETAIL")

    /** A product sold by the piece (no device, no identifier). */
    val isQuantity: Boolean get() = quantity != null

    /** This sale was taken on credit (ADR 0035): a return lowers the debt, no cash back. */
    val onCredit: Boolean get() = creditId != null

    /** The unit's identifier — IMEI or serial number (ADR 0029); empty for a quantity sale. */
    val code: String get() = UnitCode.display(imei, serialNumber)
}

fun SaleDto.toDomain() = Sale(
    id = id,
    imei = device?.imei,
    imei2 = device?.imei2,
    serialNumber = device?.serialNumber,
    // A quantity sale has no device: its product rides `model`, with `quantity`.
    modelLabel = (device?.model ?: model)?.let { "${it.brand} ${it.name}".trim() } ?: "",
    quantity = quantity,
    customerName = customer?.name,
    customerPhone = customer?.phone,
    salePrice = salePrice,
    netProfit = netProfit,
    soldAt = soldAt,
    soldByName = soldBy.name,
    warrantyDays = warranty?.days,
    consignmentId = consignmentId,
    creditId = creditId,
    returnedAt = returnInfo?.returnedAt,
    payments = payments.map { AccountAmount(it.accountCode, parseMoney(it.amount)) },
    listPrice = listPrice,
    discountAmount = discountAmount,
    priceLevelCode = priceLevelCode,
)

/** Aggregate stats for the sales list header. Money stays a string; profit is redacted (nullable). */
data class SaleStats(
    val count: Int,
    val revenue: String,
    val avgPrice: String,
    val returnedCount: Int,
    val refundTotal: String,
    val netProfit: String?,
)

fun SaleStatsDto.toDomain() = SaleStats(
    count = count,
    revenue = revenue,
    avgPrice = avgPrice,
    returnedCount = returnedCount,
    refundTotal = refundTotal,
    netProfit = netProfit,
)

/** A cashier option for the sales filter. */
data class UserOption(val id: String, val name: String)

fun UserOptionDto.toOption() = UserOption(
    id = id,
    name = profile?.let { "${it.firstName} ${it.lastName ?: ""}".trim() }?.takeIf { it.isNotBlank() } ?: email,
)

/** Warranty status for a returning customer, keyed by IMEI. Built online or offline. */
data class Warranty(
    val imei: String?,
    val serialNumber: String? = null,
    val saleId: String,
    val salePrice: String,
    val remainingDays: Int,
    val hasWarranty: Boolean,
    val grade: String?,
    val notes: String?,
    val alreadyReturned: Boolean,
) {
    val active: Boolean get() = hasWarranty && remainingDays > 0

    /** The unit's identifier — IMEI or serial number (ADR 0029). */
    val code: String get() = UnitCode.display(imei, serialNumber)
}

fun WarrantyDto.toDomain() = Warranty(
    imei = imei,
    serialNumber = serialNumber,
    saleId = saleId,
    salePrice = salePrice,
    remainingDays = remainingDays,
    hasWarranty = warranty != null,
    grade = latestInspection?.grade,
    notes = latestInspection?.notes,
    alreadyReturned = alreadyReturned,
)
