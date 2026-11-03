package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/**
 * Customer directory filters in a bottom sheet: has-purchases and sort. Search
 * stays inline on the screen. Both controls apply immediately through the
 * ViewModel (each resets to page 1).
 */
@Composable
fun CustomerFilterSheet(
    hasPurchases: String,
    sort: String,
    onHasPurchases: (String) -> Unit,
    onSort: (String) -> Unit,
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
        SegmentedControl(
            options = listOf(
                SegmentOption("all", t("common.all", null)),
                SegmentOption("yes", t("common.yes", null)),
                SegmentOption("no", t("common.no", null)),
            ),
            selected = hasPurchases,
            onSelect = onHasPurchases,
            modifier = Modifier.fillMaxWidth(),
        )
        SegmentedControl(
            options = listOf(
                SegmentOption("recent", t("common.date", null)),
                SegmentOption("name", t("common.name", null)),
            ),
            selected = sort,
            onSelect = onSort,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
