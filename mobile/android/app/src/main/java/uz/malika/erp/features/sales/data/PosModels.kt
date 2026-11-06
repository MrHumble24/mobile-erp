package uz.malika.erp.features.sales.data

import uz.malika.erp.data.local.DeviceEntity
import uz.malika.erp.data.local.ProductEntity
import uz.malika.erp.features.sales.lib.DiscountSettings
import uz.malika.erp.features.sales.lib.PriceCache
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.payments.AccountAmount
import java.math.BigDecimal

/** A chosen customer's bonus balance and the store's max redeem share (ADR 0043). */
data class CustomerBonus(
    val customerId: String,
    val balance: BigDecimal,
    val maxPercent: BigDecimal,
)

/**
 * The till's settings bundle (one `GET /settings` read): the discount rules plus
 * the customer-credit (ADR 0035) and shifts (ADR 0036) switches the till gates on.
 */
data class TillSettings(
    val discount: DiscountSettings = DiscountSettings(),
    val creditEnabled: Boolean = false,
    val shiftsEnabled: Boolean = false,
    // Bonus points (ADR 0043).
    val bonusEnabled: Boolean = false,
    // Receipt / price-tag printing (ADR 0043).
    val receiptPrintingEnabled: Boolean = false,
    val receiptPaperWidthMm: Int = 80,
    val priceTagsEnabled: Boolean = false,
    // Store identity shown on receipts.
    val storeName: String? = null,
    val storeAddress: String? = null,
    val storePhone: String? = null,
    val receiptFooter: String? = null,
)

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
    val prices: Map<String, String?>? = null,
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
            prices = PriceCache.parse(d.pricesJson),
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
            prices = d.prices,
        )
    }
}

/** What a till scan/lookup resolves to (ADR 0030). Units win over barcodes. */
sealed interface ScanOutcome {
    data class Unit(val device: ScannedDevice) : ScanOutcome
    data class Product(val product: CartProduct) : ScanOutcome
    data object NotFound : ScanOutcome
}

/**
 * A quantity product resolved for the till — from the offline Room cache, a scan
 * or a name search (ADR 0030). [salePrice] is the default per-piece price.
 */
data class CartProduct(
    val modelId: String,
    val brand: String,
    val name: String,
    val barcode: String?,
    val salePrice: String?,
    val inStock: Int,
    val prices: Map<String, String?>? = null,
) {
    val label: String get() = "$brand $name".trim()

    companion object {
        fun fromCache(p: ProductEntity) = CartProduct(
            modelId = p.modelId,
            brand = p.brand,
            name = p.name,
            barcode = p.barcode,
            salePrice = p.salePrice,
            inStock = p.quantity,
            prices = PriceCache.parse(p.pricesJson),
        )

        fun fromDto(p: QuantityProductDto) = CartProduct(
            modelId = p.modelId,
            brand = p.brand,
            name = p.name,
            barcode = p.barcode,
            salePrice = p.salePrice,
            inStock = p.quantity,
            prices = p.prices,
        )
    }
}

/**
 * One printed line item. [code] is the unit's IMEI/serial (unit sale) or empty
 * (quantity sale); [quantity] is set only for a quantity line (shows `× n`).
 */
data class ReceiptLineItem(
    val model: String,
    val code: String,
    val price: String,
    val sub: String?,
    val quantity: Int? = null,
)

/** One trade-in on a receipt / sale (ADR 0039): its value lowers what was paid. */
data class ReceiptTradeIn(val model: String, val code: String, val value: String)

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
    // Pricing (ADR 0034): shown when there was a discount or a non-retail level.
    val priceLevelCode: String? = null,
    val listTotal: String? = null,
    val discountTotal: String? = null,
    /** Trade-ins taken in part payment (ADR 0039); their values lower [amountPaid]. */
    val tradeIns: List<ReceiptTradeIn> = emptyList(),
    /** What the customer actually tendered (total − Σ trade-in values); null when none. */
    val amountPaid: String? = null,
    /** Shop identity for the receipt header (ADR 0043). */
    val storeName: String? = null,
    val storeAddress: String? = null,
    val storePhone: String? = null,
    /** Free-text receipt footer, or null. */
    val footer: String? = null,
    /** Loyalty points spent (ADR 0043); null when none spent. */
    val pointsSpent: String? = null,
    /** Loyalty points earned (ADR 0043); null when none earned. */
    val pointsEarned: String? = null,
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
            quantity = it.quantity,
        )
    },
    total = total,
    warrantyUntil = warranty?.endsAt,
    payments = payments.map { AccountAmount(it.accountCode, uz.malika.erp.shared.lib.parseMoney(it.amount)) },
    storeName = store.name,
    storeAddress = store.address,
    storePhone = store.phone,
    footer = footer,
    pointsSpent = bonus.spent.takeIf { uz.malika.erp.shared.lib.parseMoney(it).signum() > 0 },
    pointsEarned = bonus.earned.takeIf { uz.malika.erp.shared.lib.parseMoney(it).signum() > 0 },
    tradeIns = tradeIns.map {
        ReceiptTradeIn("${it.model.brand} ${it.model.name}".trim(), UnitCode.display(it.imei, it.serialNumber), it.value)
    },
    amountPaid = tradeIns
        .takeIf { it.isNotEmpty() }
        ?.let { tis ->
            val paid = uz.malika.erp.shared.lib.parseMoney(total)
                .subtract(tis.fold(java.math.BigDecimal.ZERO) { a, ti -> a + uz.malika.erp.shared.lib.parseMoney(ti.value) })
            paid.toPlainString()
        },
)
