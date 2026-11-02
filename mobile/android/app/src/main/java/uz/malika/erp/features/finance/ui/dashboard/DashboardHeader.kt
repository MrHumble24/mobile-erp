package uz.malika.erp.features.finance.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.ProfitReport
import uz.malika.erp.features.finance.model.DashPeriod
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.model.periodStart
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens
import java.util.Date

/** Cross-feature quick actions; routes are navigated safely (no-op if absent). */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun QuickActions(onNavigate: (String) -> Unit) {
    val t = LocalT.current
    val can = LocalCan.current
    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (can("sale.create")) {
            PillButton(t("nav.pos", null), onClick = { onNavigate("pos") })
        }
        if (can("expense.read")) {
            PillButton(t("nav.expenses", null), onClick = { onNavigate("expenses") }, variant = ButtonVariant.OUTLINE)
        }
    }
}

/** Revenue/profit KPI tiles with a today/week/month toggle (`/reports/profit`). */
@Composable
fun KpiSection(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    var period by remember { mutableStateOf(DashPeriod.TODAY) }
    Column(Modifier.fillMaxWidth()) {
        SegmentedControl(
            options = listOf(
                SegmentOption(DashPeriod.TODAY, t("dashboard.periodToday", null)),
                SegmentOption(DashPeriod.WEEK, t("dashboard.periodWeek", null)),
                SegmentOption(DashPeriod.MONTH, t("dashboard.periodMonth", null)),
            ),
            selected = period,
            onSelect = { period = it },
        )
        Spacer(Modifier.height(12.dp))
        val now = remember { Date() }
        val from = isoDate(periodStart(period, now))
        val to = isoDate(now)
        val handle = rememberAsync(period) { vm.profit(from, to) }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { p -> KpiTiles(p) }
    }
}

@Composable
private fun KpiTiles(p: ProfitReport) {
    val t = LocalT.current
    MetricGrid(
        tiles = listOf(
            { m ->
                MetricTile(
                    t("dashboard.grossProfit", null), p.grossProfit, m,
                    subtext = "${p.unitsSold} ${t("dashboard.unitsSold", null)}",
                )
            },
            { m -> MetricTile(t("dashboard.netOperatingIncome", null), p.netOperatingIncome, m, emphasis = Tokens.success) },
            { m ->
                MetricTile(
                    t("dashboard.revenue", null), p.revenue, m,
                    subtext = "${t("dashboard.retail", null)}: ${formatMoney(p.byChannel.retail)}",
                )
            },
            { m -> MetricTile(t("dashboard.expenses", null), p.expenses, m, emphasis = Tokens.danger) },
        ),
    )
}
