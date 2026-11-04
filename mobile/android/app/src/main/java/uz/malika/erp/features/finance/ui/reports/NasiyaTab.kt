package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.app.Destination
import uz.malika.erp.features.finance.data.ConsignmentPartnerRow
import uz.malika.erp.features.finance.data.ConsignmentsReport
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BreakdownBars
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.ui.theme.Tokens

/** Nasiya (consignments) report: movement tiles + outstanding-by-partner bars. */
@Composable
fun NasiyaTab(
    vm: FinanceReadsViewModel,
    fromIso: String?,
    toIso: String?,
    onDrill: (ReportDrill) -> Unit,
) {
    val t = LocalT.current
    val handle = rememberAsync(fromIso, toIso) { vm.consignmentsReport(fromIso, toIso) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = Tokens.Space.lg),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        AsyncContent(handle, retryLabel = t("common.retry", null)) { r -> Body(r, onDrill) }
    }
}

@Composable
private fun Body(r: ConsignmentsReport, onDrill: (ReportDrill) -> Unit) {
    val t = LocalT.current
    MetricGrid(
        tiles = listOf(
            { m -> MetricTile(t("reports.outstandingTotal", null), r.outstandingTotal, m, emphasis = Tokens.danger) },
            { m -> MetricTile(t("reports.overdueCount", null), r.overdueCount.toString(), m, money = false, emphasis = if (r.overdueCount > 0) Tokens.danger else null) },
            { m -> MetricTile(t("reports.created", null), r.createdCount.toString(), m, money = false) },
            { m -> MetricTile(t("reports.settled", null), r.settledCount.toString(), m, money = false, subtext = formatMoney(r.settledRevenue)) },
            { m -> MetricTile(t("reports.returned", null), r.returnedCount.toString(), m, money = false) },
        ),
    )
    val total = parseMoney(r.outstandingTotal).toDouble().coerceAtLeast(1.0)
    BreakdownBars(
        title = t("reports.outstandingByPartner", null),
        rows = r.byPartner.map {
            val value = parseMoney(it.outstanding).toDouble()
            BreakdownDatum(it.partnerId, it.shopName, value, value / total)
        },
        formatValue = ::moneyOf,
        onSelect = { datum ->
            r.byPartner.firstOrNull { it.partnerId == datum.key }?.let { onDrill(partnerDrill(it, t)) }
        },
    )
}

private fun partnerDrill(row: ConsignmentPartnerRow, t: (String, Map<String, Any?>?) -> String) =
    ReportDrill(
        title = row.shopName,
        lines = listOf(
            DrillLine(t("reports.outstanding", null), formatMoney(row.outstanding)),
            DrillLine(t("reports.created", null), row.openCount.toString()),
            DrillLine(t("reports.overdueCount", null), row.overdueCount.toString()),
            DrillLine(t("reports.settled", null), formatMoney(row.settledRevenue)),
        ),
        destination = Destination.Consignments(),
        actionLabel = t("nav.consignments", null),
    )
