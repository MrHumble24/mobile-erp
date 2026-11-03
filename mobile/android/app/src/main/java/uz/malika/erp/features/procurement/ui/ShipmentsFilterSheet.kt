package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.procurement.model.ShipmentStatusFilter
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/**
 * Shipment filter bottom sheet: the status facet (open / received / all) and the
 * date range, both applied client-side through the ViewModel. The tab segment
 * (Shipments / Suppliers) is navigation and stays on the screen; search is inline.
 */
@Composable
fun ShipmentsFilterSheet(
    status: ShipmentStatusFilter,
    range: DateRange,
    onStatus: (ShipmentStatusFilter) -> Unit,
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
        SegmentedControl(
            options = listOf(
                SegmentOption(ShipmentStatusFilter.ALL, t("common.all", null)),
                SegmentOption(ShipmentStatusFilter.OPEN, t("shipments.statusOpen", null)),
                SegmentOption(ShipmentStatusFilter.RECEIVED, t("shipments.statusComplete", null)),
            ),
            selected = status,
            onSelect = onStatus,
            modifier = Modifier.fillMaxWidth(),
        )
        AppDateRangeField(label = t("common.date", null), range = range, onPick = onRange)
    }
}
