package uz.malika.erp.features.sales.data

import uz.malika.erp.data.local.DeviceEntity

/**
 * A device resolved for checkout — from the offline Room cache or the online
 * by-IMEI lookup, normalized to what POS needs.
 */
data class ScannedDevice(
    val id: String,
    val imei: String,
    val version: Int,
    val statusCode: String,
    val modelLabel: String,
    val targetPrice: String?,
) {
    val inStock: Boolean get() = statusCode == "IN_STOCK"

    companion object {
        fun fromCache(d: DeviceEntity) = ScannedDevice(
            id = d.id,
            imei = d.imei,
            version = d.version,
            statusCode = d.statusCode,
            modelLabel = "${d.modelBrand} ${d.modelName}".trim(),
            targetPrice = d.targetPrice,
        )

        fun fromDto(d: DeviceByImeiDto) = ScannedDevice(
            id = d.id,
            imei = d.imei,
            version = d.version,
            statusCode = d.statusCode,
            modelLabel = "${d.model.brand} ${d.model.name}".trim(),
            targetPrice = d.targetPrice,
        )
    }
}

/** One printed line item. */
data class ReceiptLineItem(val model: String, val imei: String, val price: String, val sub: String?)

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
            imei = it.imei,
            price = it.price,
            sub = listOfNotNull(it.storage, it.color).joinToString(" · ").ifEmpty { null },
        )
    },
    total = total,
    warrantyUntil = warranty?.endsAt,
)
