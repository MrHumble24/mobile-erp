package uz.malika.erp.features.inventory.ui
import uz.malika.erp.shared.ui.AppSelect

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.Tokens

/**
 * Manual status-change form inside the device sheet. Online-only (not an outbox
 * mutation): blocked when offline. Surfaces the 409 version-conflict message.
 */
@Composable
fun StatusChangeForm(
    device: DeviceDetail,
    devicesVm: DevicesViewModel,
    online: Boolean,
    toaster: Toaster,
    onChanged: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val transitions = DeviceStatusMeta.transitionsFor(device.statusCode)
    if (transitions.isEmpty()) return

    var target by remember { mutableStateOf(transitions.first()) }
    var reason by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    fun submit() {
        saving = true
        message = null
        scope.launch {
            try {
                devicesVm.changeStatus(device.id, target, device.version, reason)
                toaster.success(t("common.success", null))
                onChanged()
            } catch (e: AppException) {
                message = if (e.statusCode == 409) t("inventory.versionConflict", null) else e.message
                if (e.statusCode == 409) onChanged()
            } finally {
                saving = false
            }
        }
    }

    Column(Modifier.fillMaxWidth()) {
        Spacer(Modifier.height(12.dp))
        HorizontalDivider(color = Tokens.border)
        Spacer(Modifier.height(12.dp))
        Text(t("inventory.changeStatus", null), style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(4.dp))
        Text(t("inventory.statusManualHint", null), style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(12.dp))
        AppSelect(
            value = target,
            options = transitions,
            optionLabel = { t(DeviceStatusMeta.labelKey(it), null) },
            onSelect = { target = it ?: transitions.first() },
            label = t("inventory.newStatus", null),
        )
        Spacer(Modifier.height(12.dp))
        AppFormField(
            label = t("inventory.reason", null),
            value = reason,
            onValueChange = { reason = it },
        )
        message?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.destructive)
        }
        if (!online) {
            Spacer(Modifier.height(8.dp))
            Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        }
        Spacer(Modifier.height(12.dp))
        PillButton(
            text = if (saving) t("common.loading", null) else t("common.save", null),
            onClick = { submit() },
            enabled = online && !saving,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
