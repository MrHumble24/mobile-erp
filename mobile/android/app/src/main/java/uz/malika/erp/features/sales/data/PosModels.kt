package uz.malika.erp.features.sales.data

import uz.malika.erp.data.local.DeviceEntity
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.payments.AccountAmount

/**
 * A device resolved for checkout — from the offline Room cache or the online
 * by-IMEI lookup, normalized to what POS needs.
 */
data class ScannedDevice(
    val id: String,
    val imei: String? = null,
    val imei2: String? = null,
    val serialNumber: String? = null,
    val version: Int,
    val statusCode: String,
    val modelLabel: String,
    val targetPrice: String?,
) {
    val inStock: Boolean get() = statusCode == "IN_STOCK"

    /** The identifier shown and keyed on — IMEI or serial number (ADR 0029). */
    val code: String get() = UnitCode.display(imei, serialNumber)

    companion object {
        fun fromCache(d: DeviceEntity) = ScannedDevice(
            id = d.id,
            imei = d.imei,
            imei2 = d.imei2,
            serialNumber = d.serialNumber,
            version = d.version,
            statusCode = d.statusCode,
            modelLabel = "${d.modelBrand} ${d.modelName}".trim(),
            targetPrice = d.targetPrice,
        )

        fun fromDto(d: DeviceByImeiDto) = ScannedDevice(
            id = d.id,
            imei = d.imei,
            imei2 = d.imei2,
            serialNumber = d.serialNumber,
            version = d.version,
            statusCode = d.statusCode,
            modelLabel = "${d.model.brand} ${d.model.name}".trim(),
            targetPrice = d.targetPrice,
        )
    }
}

/** One printed line item; [code] is the unit's IMEI or serial number. */
data class ReceiptLineItem(val model: String, val code: String, val price: String, val sub: String?)

/**
 * The single render model for both receipts: the POS post-checkout receipt
 * (built locally so it works offline) and the sales-list receipt (from the
 * server `ReceiptView`). Carries no cost/profit, ever.
 */
data class ReceiptData(
    val receiptId: String,
    val soldAt: String?,
    val cashier: String,
    val customerName: String?,
    val items: List<ReceiptLineItem>,
    val total: String,
    val warrantyUntil: String?,
    val pending: Boolean = false,
    /** How it was tendered (cart-level), for the "Paid with" lines; empty shows nothing. */
    val payments: List<AccountAmount> = emptyList(),
)

/** Map the server receipt payload into the shared render model. */
fun ReceiptDto.toReceiptData() = ReceiptData(
    receiptId = saleId,
    soldAt = soldAt,
    cashier = cashier,
    customerName = customer?.name,
    items = items.map {
        ReceiptLineItem(
            model = it.model,
            code = UnitCode.display(it.imei.ifBlank { null }, it.serialNumber),
            price = it.price,
            sub = listOfNotNull(it.storage, it.color).joinToString(" · ").ifEmpty { null },
        )
    },
    total = total,
    warrantyUntil = warranty?.endsAt,
)
