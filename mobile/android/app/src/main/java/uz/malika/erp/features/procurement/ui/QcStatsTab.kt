package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.QcStatsDto
import uz.malika.erp.features.procurement.model.StatsPreset
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterButton
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.ui.theme.Tokens

/** QC statistics; the period presets and custom range live in the filter sheet. */
@Composable
fun QcStatsTab(
    stats: QcStatsDto,
    preset: StatsPreset,
    range: DateRange,
    onPreset: (StatsPreset) -> Unit,
    onCustomRange: (DateRange) -> Unit,
) {
    val t = LocalT.current
    var showFilters by remember { mutableStateOf(false) }
    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                t(statsPresetLabelKey(preset), null),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f),
            )
            FilterButton(
                activeCount = if (preset != StatsPreset.SEVEN_DAYS) 1 else 0,
                onClick = { showFilters = true },
            )
        }
        Spacer(Modifier.height(16.dp))
        MetricGrid(
            perRow = 3,
            tiles = listOf(
                { m -> MetricTile(t("qc.statInspected", null), "${stats.inspected}", m, money = false) },
                { m -> MetricTile(t("qc.statPassRate", null), "${Math.round(stats.passRate * 100)}%", m, money = false) },
                { m -> MetricTile(t("qc.statFailed", null), "${stats.failed}", m, money = false) },
                { m -> MetricTile(t("qc.awaitingInspection", null), "${stats.awaitingInspection}", m, money = false) },
                { m -> MetricTile(t("qc.statAvgBattery", null), stats.avgBatteryHealth?.let { "$it%" } ?: "-", m, money = false) },
            ),
        )
        Spacer(Modifier.height(20.dp))
        Breakdown(t("qc.byGrade", null), stats.byGrade.map { it.gradeCode to it.count })
        Spacer(Modifier.height(16.dp))
        Breakdown(t("qc.topDefects", null), stats.topDefects.map { it.display to it.count })
    }

    if (showFilters) {
        QcStatsFilterSheet(
            preset = preset,
            range = range,
            onPreset = onPreset,
            onCustomRange = onCustomRange,
            onReset = { onPreset(StatsPreset.SEVEN_DAYS) },
            onDismiss = { showFilters = false },
        )
    }
}

@Composable
private fun Breakdown(title: String, rows: List<Pair<String, Int>>) {
    val t = LocalT.current
    val max = rows.maxOfOrNull { it.second }?.coerceAtLeast(1) ?: 1
    AppCard(modifier = Modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(10.dp))
        if (rows.isEmpty()) {
            Text(t("common.notFound", null), style = MaterialTheme.typography.bodySmall)
        } else {
            rows.forEach { (label, count) ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(label, style = MaterialTheme.typography.bodyMedium)
                    Text("$count", style = MaterialTheme.typography.bodySmall)
                }
                Spacer(Modifier.height(4.dp))
                Box(Modifier.fillMaxWidth().height(6.dp).background(Tokens.bone, RoundedCornerShape(3.dp))) {
                    Box(
                        Modifier.fillMaxWidth(count.toFloat() / max).height(6.dp)
                            .background(Tokens.primary, RoundedCornerShape(3.dp)),
                    )
                }
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}
