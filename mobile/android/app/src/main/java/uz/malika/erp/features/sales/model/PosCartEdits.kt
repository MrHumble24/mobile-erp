package uz.malika.erp.features.sales.model

import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.lib.Discount
import uz.malika.erp.features.sales.lib.DiscountMode
import uz.malika.erp.features.sales.lib.PriceLevel
import java.math.BigDecimal

fun PosViewModel.setLinePrice(key: String, price: String) = mapLine(key) {
    when (it) {
        is CartLine.Unit -> it.copy(salePrice = price)
        is CartLine.Quantity -> it.copy(unitPrice = price)
    }
}

fun PosViewModel.setLineWarranty(key: String, days: String) = mapLine(key) {
    if (it is CartLine.Unit) it.copy(warrantyDays = days) else it
}

fun PosViewModel.setLineQuantity(key: String, quantity: Int) = mapLine(key) {
    if (it is CartLine.Quantity) it.copy(quantity = quantity.coerceAtLeast(1)) else it
}

/** Set or clear a per-line discount; clears any whole-cart discount (one or the other). */
fun PosViewModel.setLineDiscount(key: String, discount: Discount?) {
    val lines = _state.value.lines.map {
        if (it.key != key) it else when (it) {
            is CartLine.Unit -> it.copy(discount = discount)
            is CartLine.Quantity -> it.copy(discount = discount)
        }
    }
    _state.value = _state.value.copy(lines = lines, cartDiscount = null, standingPrefill = false)
}

/** Set or clear the whole-cart discount; it spreads over the list-priced lines. */
fun PosViewModel.setCartDiscount(discount: Discount?) {
    _state.value = _state.value.copy(cartDiscount = discount, standingPrefill = false)
}

/** Switch the price level by hand; re-prices every line. */
fun PosViewModel.setLevel(level: String) { _state.value = _state.value.copy(level = level) }

/**
 * The chosen customer drives the level and prefills their standing discount
 * (percent) — removable. No customer / none chosen falls back to walk-in and
 * clears a standing prefill.
 */
fun PosViewModel.applyCustomer(priceLevelCode: String?, standingPercent: BigDecimal) {
    val s = _state.value
    val level = priceLevelCode?.takeIf { it.isNotBlank() } ?: PriceLevel.DEFAULT
    val next = if (standingPercent.signum() > 0) {
        s.copy(level = level, standingPercent = standingPercent, cartDiscount = Discount(DiscountMode.PERCENT, standingPercent), standingPrefill = true)
    } else if (s.standingPrefill) {
        s.copy(level = level, standingPercent = BigDecimal.ZERO, cartDiscount = null, standingPrefill = false)
    } else {
        s.copy(level = level, standingPercent = BigDecimal.ZERO)
    }
    _state.value = next
}

/** Toggle "type a price" for a line (only effective for `sale.price.override`). */
fun PosViewModel.toggleOverride(key: String) {
    val s = _state.value
    if (!s.canOverride) return
    val next = if (key in s.overriding) s.overriding - key else s.overriding + key
    _state.value = s.copy(overriding = next)
}

fun PosViewModel.removeLine(key: String) {
    _state.value = _state.value.copy(lines = _state.value.lines.filterNot { it.key == key })
}

private fun PosViewModel.mapLine(key: String, f: (CartLine) -> CartLine) {
    _state.value = _state.value.copy(lines = _state.value.lines.map { if (it.key == key) f(it) else it })
}
