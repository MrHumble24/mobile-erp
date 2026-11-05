package uz.malika.erp.features.sales.data

import uz.malika.erp.features.sales.lib.Discount
import uz.malika.erp.features.sales.lib.Pricing
import uz.malika.erp.shared.lib.parseMoney
import java.math.BigDecimal

/**
 * One line in the POS cart. A cart may mix phones, serial units and quantity
 * products (ADR 0030); each line becomes its own `sale.create` at checkout.
 *
 * - [key] identifies the line for edits/removal (a unit's code, or `model:<id>`).
 * - [typedTotal] is the price the seller typed (the whole line) — used only when
 *   the line has no list price at the current level or the seller is overriding.
 * - [discount] is a per-line discount (ADR 0034); a list-priced line's final
 *   price is `listTotal(level) − discount` (computed in [uz.malika.erp.features.sales.lib.CartPricing]).
 */
sealed interface CartLine {
    val key: String
    val discount: Discount?

    /** The whole-line price the seller typed (per-piece × quantity for a quantity line). */
    val typedTotal: BigDecimal

    /** The resolved list prices per level for this line's unit/product (null = none cached). */
    val levelPrices: Map<String, String?>?

    /** The list price for the whole line at [level] (× quantity for a quantity line), or null. */
    fun listTotal(level: String): BigDecimal?

    /** A scanned device (phone or serial unit): one sale, with warranty. */
    data class Unit(
        val device: ScannedDevice,
        val salePrice: String,
        val warrantyDays: String,
        override val discount: Discount? = null,
    ) : CartLine {
        override val key: String get() = device.code
        override val typedTotal: BigDecimal get() = parseMoney(salePrice)
        override val levelPrices: Map<String, String?>? get() = device.prices
        override fun listTotal(level: String): BigDecimal? = Pricing.levelPrice(device.prices, level)
    }

    /** A quantity product: N pieces at a per-piece price; no warranty, no lock. */
    data class Quantity(
        val product: CartProduct,
        val quantity: Int,
        val unitPrice: String,
        override val discount: Discount? = null,
    ) : CartLine {
        override val key: String get() = "model:${product.modelId}"
        override val typedTotal: BigDecimal get() = parseMoney(unitPrice).multiply(BigDecimal(quantity))
        override val levelPrices: Map<String, String?>? get() = product.prices
        override fun listTotal(level: String): BigDecimal? =
            Pricing.levelPrice(product.prices, level)?.multiply(BigDecimal(quantity))

        /** More pieces than counted in stock — warn, never block (ADR 0030). */
        val overStock: Boolean get() = quantity > product.inStock
    }
}
