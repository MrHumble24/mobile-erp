package uz.malika.erp.features.sales.data

import uz.malika.erp.shared.lib.parseMoney
import java.math.BigDecimal

/**
 * One line in the POS cart. A cart may mix phones, serial units and quantity
 * products (ADR 0030); each line becomes its own `sale.create` at checkout.
 *
 * - [key] identifies the line for edits/removal (a unit's code, or `model:<id>`).
 * - [lineTotal] is what the line contributes to the cart total and to the split
 *   allocation (a unit's price, or unit-price × quantity).
 */
sealed interface CartLine {
    val key: String
    val lineTotal: BigDecimal

    /** A scanned device (phone or serial unit): one sale, with warranty. */
    data class Unit(
        val device: ScannedDevice,
        val salePrice: String,
        val warrantyDays: String,
    ) : CartLine {
        override val key: String get() = device.code
        override val lineTotal: BigDecimal get() = parseMoney(salePrice)
    }

    /** A quantity product: N pieces at a per-piece price; no warranty, no lock. */
    data class Quantity(
        val product: CartProduct,
        val quantity: Int,
        val unitPrice: String,
    ) : CartLine {
        override val key: String get() = "model:${product.modelId}"
        override val lineTotal: BigDecimal get() = parseMoney(unitPrice).multiply(BigDecimal(quantity))

        /** More pieces than counted in stock — warn, never block (ADR 0030). */
        val overStock: Boolean get() = quantity > product.inStock
    }
}

/** Sum of the cart's line totals, as a plain decimal string (no float). */
fun List<CartLine>.totalPrice(): String =
    fold(BigDecimal.ZERO) { acc, line -> acc + line.lineTotal }.toPlainString()
