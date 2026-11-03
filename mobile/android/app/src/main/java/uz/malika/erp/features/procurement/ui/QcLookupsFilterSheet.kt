package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/** Lookups filter sheet: the active-only / all toggle (was inline). */
@Composable
fun QcLookupsFilterSheet(
    includeInactive: Boolean,
    onToggleInactive: (Boolean) -> Unit,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(
        title = t("common.filter", null),
        onDismiss = onDismiss,
        canReset = includeInactive,
        onReset = onReset,
    ) {
        SegmentedControl(
            options = listOf(
                SegmentOption(false, t("qc.active", null)),
                SegmentOption(true, t("common.all", null)),
            ),
            selected = includeInactive,
            onSelect = onToggleInactive,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
