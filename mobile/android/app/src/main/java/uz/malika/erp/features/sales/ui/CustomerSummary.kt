package uz.malika.erp.features.sales.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.sales.data.CustomerStats
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile

/** Stats tiles for the customer directory (mirrors the web CustomerSummary). */
@Composable
fun CustomerSummary(stats: CustomerStats, modifier: Modifier = Modifier) {
    val t = LocalT.current
    MetricGrid(
        tiles = listOf(
            { m -> MetricTile(t("customers.statTotal", null), stats.total.toString(), m, money = false) },
            { m -> MetricTile(t("customers.statNewThisMonth", null), stats.newThisMonth.toString(), m, money = false) },
            { m -> MetricTile(t("customers.statWithPurchases", null), stats.withPurchases.toString(), m, money = false) },
            { m -> MetricTile(t("customers.statRepeatBuyers", null), stats.repeatBuyers.toString(), m, money = false) },
        ),
        modifier = modifier,
        perRow = 2,
    )
}
