package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.Tokens

/**
 * Hand-fix a phone's customs fee (permission `customs.manage`). Works on any
 * status, sold included; the server posts the CUSTOMS difference. Online-only.
 */
@Composable
fun EditCustomsFeeSheet(
    device: DeviceDetail,
    devicesVm: DevicesViewModel,
    online: Boolean,
    toaster: Toaster,
    onSaved: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var fee by remember { mutableStateOf(device.customsFee ?: "") }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun save() {
        val amount = fee.trim().toDoubleOrNull()
        if (amount == null || amount < 0) { error = t("common.required", null); return }
        saving = true
        error = null
        scope.launch {
            try {
                devicesVm.setCustomsFee(device.id, amount)
                toaster.success(t("inventory.customsFeeSaved", null))
                onSaved()
            } catch (e: AppException) {
                saving = false
                error = e.message
            }
        }
    }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(t("inventory.editCustomsFee", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Text(device.imei, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))
        AppFormField(
            label = t("inventory.customsFee", null),
            value = fee,
            onValueChange = { fee = it },
            keyboardType = KeyboardType.Decimal,
        )
        error?.let {
            Spacer(Modifier.height(Tokens.Space.md))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
        if (!online) {
            Spacer(Modifier.height(Tokens.Space.md))
            Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        }
        Spacer(Modifier.height(Tokens.Space.gutter))
        PillButton(
            text = if (saving) t("common.loading", null) else t("common.save", null),
            onClick = { save() },
            enabled = online && !saving,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
