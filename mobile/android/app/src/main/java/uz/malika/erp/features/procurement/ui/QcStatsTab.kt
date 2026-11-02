package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.QcStatsDto
import uz.malika.erp.features.procurement.model.StatsPreset
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/** QC statistics with three quick date-range presets. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun QcStatsTab(stats: QcStatsDto, preset: StatsPreset, onPreset: (StatsPreset) -> Unit) {
    val t = LocalT.current
    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
        SegmentedControl(
            options = listOf(
                SegmentOption(StatsPreset.TODAY, t("qc.preset_today", null)),
                SegmentOption(StatsPreset.SEVEN_DAYS, t("qc.preset_7d", null)),
                SegmentOption(StatsPreset.THIRTY_DAYS, t("qc.preset_30d", null)),
            ),
            selected = preset,
            onSelect = onPreset,
        )
        Spacer(Modifier.height(16.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Tile(t("qc.statInspected", null), "${stats.inspected}")
            Tile(t("qc.statPassRate", null), "${Math.round(stats.passRate * 100)}%")
            Tile(t("qc.statFailed", null), "${stats.failed}")
            Tile(t("qc.awaitingInspection", null), "${stats.awaitingInspection}")
            Tile(t("qc.statAvgBattery", null), stats.avgBatteryHealth?.let { "$it%" } ?: "-")
        }
        Spacer(Modifier.height(20.dp))
        Breakdown(t("qc.byGrade", null), stats.byGrade.map { it.gradeCode to it.count })
        Spacer(Modifier.height(16.dp))
        Breakdown(t("qc.topDefects", null), stats.topDefects.map { it.display to it.count })
    }
}

@Composable
private fun Tile(label: String, value: String) {
    Box(Modifier.width(150.dp)) {
        AppCard(modifier = Modifier.fillMaxWidth()) {
            Text(value, style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(4.dp))
            Text(label, style = MaterialTheme.typography.bodySmall)
        }
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
