package uz.malika.erp.features.nasiya.ui

import androidx.compose.runtime.Composable
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterSheet

/**
 * Consignment filter bottom sheet: the date range. The Out/Overdue/Settled/
 * Returned/All segmented control is navigation and stays on the screen; search
 * stays inline. The range applies immediately through the ViewModel.
 */
@Composable
fun ConsignmentFilterSheet(
    range: DateRange,
    onRange: (DateRange) -> Unit,
    canReset: Boolean,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(
        title = t("common.filter", null),
        onDismiss = onDismiss,
        canReset = canReset,
        onReset = onReset,
    ) {
        AppDateRangeField(label = t("common.date", null), range = range, onPick = onRange)
    }
}
