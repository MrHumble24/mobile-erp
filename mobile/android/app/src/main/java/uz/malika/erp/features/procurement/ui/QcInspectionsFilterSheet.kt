package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.procurement.model.ResultFilter
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/** Inspections filter sheet: the pass/fail result selector (was inline). */
@Composable
fun QcInspectionsFilterSheet(
    filter: ResultFilter,
    onFilter: (ResultFilter) -> Unit,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(
        title = t("common.filter", null),
        onDismiss = onDismiss,
        canReset = filter != ResultFilter.ALL,
        onReset = onReset,
    ) {
        SegmentedControl(
            options = listOf(
                SegmentOption(ResultFilter.ALL, t("common.all", null)),
                SegmentOption(ResultFilter.PASSED, t("qc.passed", null)),
                SegmentOption(ResultFilter.FAILED, t("qc.failed", null)),
            ),
            selected = filter,
            onSelect = onFilter,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
