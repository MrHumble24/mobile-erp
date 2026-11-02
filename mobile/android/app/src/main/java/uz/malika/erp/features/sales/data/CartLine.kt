package uz.malika.erp.features.sales.data

import uz.malika.erp.shared.lib.parseMoney
import java.math.BigDecimal

/**
 * One device queued in the multi-device POS cart: the scanned device plus the
 * editable sale price and warranty days that become its own `sale.create`. The
 * server takes one device per sale, so a cart of N lines checks out as N outbox
 * ops, each carrying that device's [ScannedDevice.version] as `expectedVersion`.
 */
data class CartLine(
    val device: ScannedDevice,
    val salePrice: String,
    val warrantyDays: String,
)

/** Sum of the cart's line prices, as a plain decimal string (no float). */
fun List<CartLine>.totalPrice(): String =
    fold(BigDecimal.ZERO) { acc, line -> acc + parseMoney(line.salePrice) }.toPlainString()
