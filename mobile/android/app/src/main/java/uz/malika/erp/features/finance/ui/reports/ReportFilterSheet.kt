package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.finance.model.DashPeriod
import uz.malika.erp.features.finance.model.displayDate
import uz.malika.erp.features.finance.model.periodStart
import uz.malika.erp.features.finance.model.startOfDay
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterSheet
import java.util.Calendar
import java.util.Date

/** Report date-range presets; CUSTOM uses the date-range picker. */
enum class ReportRangePreset { TODAY, SEVEN_DAYS, THIRTY_DAYS, THIS_MONTH, CUSTOM }

/** The default preset — the last-30-days window the reports screen opens on. */
val DEFAULT_REPORT_PRESET = ReportRangePreset.THIRTY_DAYS

/** Start/end epoch-millis for a preset (CUSTOM falls back to today's range). */
fun presetRangeMillis(preset: ReportRangePreset, now: Date = Date()): Pair<Long, Long> {
    val end = now.time
    val start = when (preset) {
        ReportRangePreset.TODAY -> startOfDay(now).time
        ReportRangePreset.SEVEN_DAYS -> dayOffset(now, -6)
        ReportRangePreset.THIRTY_DAYS -> dayOffset(now, -29)
        ReportRangePreset.THIS_MONTH -> periodStart(DashPeriod.MONTH, now).time
        ReportRangePreset.CUSTOM -> startOfDay(now).time
    }
    return start to end
}

private fun dayOffset(now: Date, days: Int): Long =
    Calendar.getInstance().apply { time = startOfDay(now); add(Calendar.DAY_OF_YEAR, days) }.timeInMillis

/** The compact one-line range label shown beside the reports filter button. */
@Composable
fun reportRangeLabel(preset: ReportRangePreset, range: DateRange): String {
    val t = LocalT.current
    val start = range.startMillis
    val end = range.endMillis
    return if (preset == ReportRangePreset.CUSTOM && start != null && end != null) {
        "${displayDate(Date(start))} – ${displayDate(Date(end))}"
    } else {
        t(presetLabelKey(preset), null)
    }
}

private fun presetLabelKey(preset: ReportRangePreset): String = when (preset) {
    ReportRangePreset.TODAY -> "reports.preset_today"
    ReportRangePreset.SEVEN_DAYS -> "reports.preset_7d"
    ReportRangePreset.THIRTY_DAYS -> "reports.preset_30d"
    ReportRangePreset.THIS_MONTH -> "reports.preset_month"
    ReportRangePreset.CUSTOM -> "reports.preset_custom"
}

/**
 * The reports period sheet: presets plus a custom range. Everything applies
 * immediately; reset restores the default range.
 */
@Composable
fun ReportFilterSheet(
    preset: ReportRangePreset,
    range: DateRange,
    onPreset: (ReportRangePreset) -> Unit,
    onCustomRange: (DateRange) -> Unit,
    canReset: Boolean,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(
        title = t("reports.period", null),
        onDismiss = onDismiss,
        canReset = canReset,
        onReset = onReset,
    ) {
        AppSelectField(
            label = t("reports.period", null),
            options = listOf(
                SelectOption(ReportRangePreset.TODAY, t("reports.preset_today", null)),
                SelectOption(ReportRangePreset.SEVEN_DAYS, t("reports.preset_7d", null)),
                SelectOption(ReportRangePreset.THIRTY_DAYS, t("reports.preset_30d", null)),
                SelectOption(ReportRangePreset.THIS_MONTH, t("reports.preset_month", null)),
                SelectOption(ReportRangePreset.CUSTOM, t("reports.preset_custom", null)),
            ),
            selected = preset,
            onSelect = onPreset,
            modifier = Modifier.fillMaxWidth(),
        )
        if (preset == ReportRangePreset.CUSTOM) {
            AppDateRangeField(
                label = t("reports.period", null),
                range = range,
                onPick = onCustomRange,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
