package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.nasiya.model.PartnerActive
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/**
 * Partner filter bottom sheet: the active-status facet and the overdue toggle.
 * Both need the server (`/partners`), so when offline [enabled] is false and the
 * controls are inert. Search stays inline on the screen; every control applies
 * immediately through the ViewModel.
 */
@Composable
fun PartnerFilterSheet(
    active: PartnerActive,
    overdue: Boolean,
    enabled: Boolean,
    onActive: (PartnerActive) -> Unit,
    onOverdue: (Boolean) -> Unit,
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
                SegmentOption(PartnerActive.ALL, t("common.all", null)),
                SegmentOption(PartnerActive.ACTIVE, t("partners.active", null)),
                SegmentOption(PartnerActive.INACTIVE, t("partners.inactive", null)),
            ),
            selected = active,
            onSelect = { if (enabled) onActive(it) },
            modifier = Modifier.fillMaxWidth(),
        )
        StatusChip(
            label = t("partners.overdueOnly", null),
            color = if (overdue && enabled) Tokens.destructive else Tokens.slate,
            modifier = if (enabled) Modifier.clickable { onOverdue(!overdue) } else Modifier,
        )
    }
}
