package uz.malika.erp.features.sales.data

import kotlinx.serialization.Serializable

/**
 * `GET /settings` — only the till-relevant fields. Discount fields (ADR 0034)
 * are optional so older/partial payloads decode; money is a Decimal string.
 * Bonus/printing fields (ADR 0043) ride the existing cache, so an offline till
 * keeps the last known values.
 */
@Serializable
data class SettingsDto(
    val defaultWarrantyDays: Int = 0,
    val discountsEnabled: Boolean = false,
    val discountPercentAllowed: Boolean = true,
    val discountAmountAllowed: Boolean = true,
    val discountPresetsPercent: List<Double> = emptyList(),
    val discountPresetsAmount: List<Double> = emptyList(),
    val maxDiscountPercent: String? = null,
    // Customer credit (ADR 0035) and shifts (ADR 0036) — the till reads these to
    // show "On credit" and to gate selling while shifts are on.
    val customerCreditEnabled: Boolean = false,
    val defaultCreditLimit: String? = null,
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
