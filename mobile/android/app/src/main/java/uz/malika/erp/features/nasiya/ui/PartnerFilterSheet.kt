package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.nasiya.model.PartnerActive
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.AppSwitch
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
        Row(Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch), verticalAlignment = Alignment.CenterVertically) {
            Text(t("partners.overdueOnly", null), style = MaterialTheme.typography.bodyMedium, color = if (enabled) Tokens.text else Tokens.muted)
            Spacer(Modifier.weight(1f))
            AppSwitch(checked = overdue && enabled, onCheckedChange = onOverdue, enabled = enabled)
        }
    }
}
