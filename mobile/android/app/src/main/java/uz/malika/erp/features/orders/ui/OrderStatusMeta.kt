package uz.malika.erp.features.orders.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import uz.malika.erp.features.orders.lib.OrderRules
import uz.malika.erp.ui.theme.Tokens

/** The storefront order statuses in display order; null = the "All" filter. */
val ORDER_STATUS_FILTERS: List<String?> = listOf(
    null,
    OrderRules.STATUS_NEW,
    OrderRules.STATUS_CONTACTED,
    OrderRules.STATUS_DONE,
    OrderRules.STATUS_CANCELLED,
)

/** i18n key for a status code (or the "All" chip when null). */
fun orderStatusLabelKey(code: String?): String = when (code) {
    OrderRules.STATUS_NEW -> "orders.statusNew"
    OrderRules.STATUS_CONTACTED -> "orders.statusContacted"
    OrderRules.STATUS_DONE -> "orders.statusDone"
    OrderRules.STATUS_CANCELLED -> "orders.statusCancelled"
    else -> "orders.statusAll"
}

/** One hue per order status, shared by the list chips and the detail header. */
@Composable
fun orderStatusColor(code: String): Color = when (code) {
    OrderRules.STATUS_NEW -> Tokens.info
    OrderRules.STATUS_CONTACTED -> Tokens.warning
    OrderRules.STATUS_DONE -> Tokens.success
    OrderRules.STATUS_CANCELLED -> Tokens.danger
    else -> Tokens.slate
}
