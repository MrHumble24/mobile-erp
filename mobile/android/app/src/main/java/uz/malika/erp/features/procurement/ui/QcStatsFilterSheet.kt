package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.procurement.model.StatsPreset
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/** Stats filter sheet: period presets plus a custom date range (was inline). */
@Composable
fun QcStatsFilterSheet(
    preset: StatsPreset,
    range: DateRange,
    onPreset: (StatsPreset) -> Unit,
    onCustomRange: (DateRange) -> Unit,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(
        title = t("common.filter", null),
        onDismiss = onDismiss,
        canReset = preset != StatsPreset.SEVEN_DAYS,
        onReset = onReset,
    ) {
        SegmentedControl(
            options = listOf(
                SegmentOption(StatsPreset.TODAY, t("qc.preset_today", null)),
                SegmentOption(StatsPreset.SEVEN_DAYS, t("qc.preset_7d", null)),
                SegmentOption(StatsPreset.THIRTY_DAYS, t("qc.preset_30d", null)),
                SegmentOption(StatsPreset.CUSTOM, t("qc.preset_custom", null)),
            ),
            selected = preset,
            onSelect = onPreset,
            modifier = Modifier.fillMaxWidth(),
        )
        if (preset == StatsPreset.CUSTOM) {
            AppDateRangeField(
                label = t("qc.dateRange", null),
                range = range,
                onPick = onCustomRange,
            )
        }
    }
}

/** The i18n key for a stats preset's short label (shared by the tab's chip). */
fun statsPresetLabelKey(preset: StatsPreset): String = when (preset) {
    StatsPreset.TODAY -> "qc.preset_today"
    StatsPreset.SEVEN_DAYS -> "qc.preset_7d"
    StatsPreset.THIRTY_DAYS -> "qc.preset_30d"
    StatsPreset.CUSTOM -> "qc.preset_custom"
}
