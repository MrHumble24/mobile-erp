package uz.malika.erp.features.sales.model

import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.CartProduct
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.lib.CartPricing
import uz.malika.erp.features.sales.lib.Discount
import uz.malika.erp.features.sales.lib.DiscountSettings
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.features.sales.lib.PricedCart
import java.math.BigDecimal

/**
 * A resolved unit scan awaiting the cashier's confirmation. [device] is the
 * looked-up device (null when it did not resolve); [errorKey] is the i18n key of
 * the reason it cannot be added (null when addable). Confirm adds it to the cart.
 */
data class ScanPrompt(
    val code: String,
    val device: ScannedDevice? = null,
    val errorKey: String? = null,
) {
    val addable: Boolean get() = device != null && errorKey == null
}

/**
 * POS terminal state (ADR 0030/0031/0034): a mixed cart, a price level that
 * follows the customer, per-line and whole-cart discounts, and the switches the
 * till gates on (credit ADR 0035, shifts ADR 0036). `priced` is the single
 * priced-cart brain the UI reads.
 */
data class PosState(
    val lines: List<CartLine> = emptyList(),
    val errorKey: String? = null,
    val busy: Boolean = false,
    val completed: ReceiptData? = null,
    val defaultWarrantyDays: Int? = null,
    val pendingSold: Set<String> = emptySet(),
    val prompt: ScanPrompt? = null,
    /** Quantity products matched by a typed name search, to pick from (ADR 0030). */
    val productMatches: List<CartProduct>? = null,
    // Pricing (ADR 0034).
    val level: String = PriceLevel.DEFAULT,
    val settings: DiscountSettings = DiscountSettings(),
    val standingPercent: BigDecimal = BigDecimal.ZERO,
    val canOverride: Boolean = false,
    val canUnlimited: Boolean = false,
    val cartDiscount: Discount? = null,
    val overriding: Set<String> = emptySet(),
    val standingPrefill: Boolean = false,
    /** Customer credit (ADR 0035) and shifts (ADR 0036) switches, from settings. */
    val creditEnabled: Boolean = false,
    val shiftsEnabled: Boolean = false,
    /** Trade-ins taken in part payment (ADR 0039); `canTradeIn` = has `purchase.create`. */
    val tradeIns: List<TradeInDraft> = emptyList(),
    val canTradeIn: Boolean = false,
) {
    /** The whole cart priced at the current level — the single brain the UI reads. */
    val priced: PricedCart
        get() = CartPricing.price(lines, level, cartDiscount, overriding, settings, standingPercent, canOverride, canUnlimited)
    val total: String get() = priced.totals.payable.toPlainString()

    /** The trade-in allocation over the priced lines (ADR 0039): amount to pay + fit check. */
    val tradeInPlan: uz.malika.erp.features.sales.lib.TradeInPlan.Plan
        get() = TradeInCheckout.plan(priced.lines, tradeIns)

    /** What the customer still tenders after trade-ins (major units). */
    val amountToPay: java.math.BigDecimal
        get() = java.math.BigDecimal(tradeInPlan.amountToPayCents).movePointLeft(2)
}
