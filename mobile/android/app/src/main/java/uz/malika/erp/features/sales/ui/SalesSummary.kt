package uz.malika.erp.features.sales.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.data.SaleStats
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.signTint
import uz.malika.erp.ui.theme.Tokens

/**
 * Stats for the sales list (mirrors the web SalesSummary), collapsed by default
 * behind one header row — "Umumiy sharh", the revenue at a glance, a chevron —
 * so the five metric rows never push the first sale below the fold. Profit is
 * shown only when present (not redacted).
 */
@Composable
fun SalesSummary(stats: SaleStats, expanded: Boolean, onToggle: () -> Unit, modifier: Modifier = Modifier) {
    val t = LocalT.current
    Column(modifier.fillMaxWidth()) {
        AppCard(Modifier.fillMaxWidth(), onClick = onToggle, padding = PaddingValues(0.dp)) {
            Row(
                Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch)
                    .padding(horizontal = Tokens.Space.cardInner, vertical = Tokens.Space.rowV),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(t("reports.tab_overview", null), style = MaterialTheme.typography.labelMedium, color = Tokens.muted)
                Spacer(Modifier.weight(1f))
                MoneyText(stats.revenue, style = MaterialTheme.typography.titleMedium.copy(color = Tokens.text))
                Spacer(Modifier.width(Tokens.Space.sm))
                Icon(
                    Icons.Outlined.ExpandMore,
                    contentDescription = null,
                    tint = Tokens.muted,
                    modifier = Modifier.rotate(if (expanded) 180f else 0f),
                )
            }
        }
        AnimatedVisibility(expanded) {
            Column {
                Spacer(Modifier.height(Tokens.Space.sm))
                MetricGrid(metricTiles(stats, t), perRow = 2)
            }
        }
    }
}

@Composable
private fun metricTiles(stats: SaleStats, t: uz.malika.erp.i18n.Translate) = buildList<@Composable (Modifier) -> Unit> {
    add { m -> MetricTile(t("sales.statsCount", null), stats.count.toString(), m, money = false) }
    add { m -> MetricTile(t("sales.statsRevenue", null), stats.revenue, m) }
    add { m -> MetricTile(t("sales.statsAvgPrice", null), stats.avgPrice, m) }
    add { m ->
        MetricTile(
            t("sales.statsReturns", null),
            stats.returnedCount.toString(),
            m,
            subtext = "${t("sales.statsRefundTotal", null)}: ${formatMoney(stats.refundTotal)}",
            money = false,
        )
    }
    stats.netProfit?.let { profit ->
        add { m -> MetricTile(t("sales.statsNetProfit", null), profit, m, emphasis = signTint(profit)) }
    }
}
