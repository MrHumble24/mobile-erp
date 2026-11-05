package uz.malika.erp.features.sales.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SalesRepository

/**
 * Renders the sale detail sheet, enriching the list row with the full sale from
 * `GET /sales/:id` so it can show the trade-ins + amount paid (the list endpoint
 * omits `tradeIns`, ADR 0039). Shows the list row immediately, then swaps in the
 * enriched copy when it arrives — no spinner, the only new field is the trade-ins.
 */
@Composable
fun SaleDetailHost(
    sale: Sale,
    repo: SalesRepository,
    canReturn: Boolean,
    onReceipt: () -> Unit,
    onReturn: () -> Unit,
    onOpenDevice: () -> Unit,
    onOpenConsignment: () -> Unit,
) {
    val enriched by produceState(sale, sale.id) {
        value = runCatching { repo.sale(sale.id) }.getOrDefault(sale)
    }
    SaleDetailSheet(
        sale = enriched,
        canReturn = canReturn,
        onReceipt = onReceipt,
        onReturn = onReturn,
        onOpenDevice = onOpenDevice,
        onOpenConsignment = onOpenConsignment,
    )
}
