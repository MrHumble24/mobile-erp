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
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.AttributeDef
import uz.malika.erp.features.inventory.data.AttributeType
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Edit a device's specs (driven by the model's attribute schema) and target
 * price. Online-only — blocked with a needs-connection message when offline.
 */
@Composable
fun EditDeviceSheet(
    device: DeviceDetail,
    devicesVm: DevicesViewModel,
    catalogVm: CatalogViewModel,
    online: Boolean,
    onSaved: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()

    val attrs = remember(device.modelId) {
        catalogVm.attributesOf(device.modelId).ifEmpty {
            device.specs.keys.map { AttributeDef(key = it, label = it, type = AttributeType.TEXT) }
        }
    }
    val specs = remember { mutableStateMapOf<String, String>().apply { putAll(device.specs) } }
    var targetPrice by remember { mutableStateOf(device.targetPrice ?: "") }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun buildSpecs(): Map<String, Any> = buildMap {
        attrs.forEach { attr ->
            val raw = specs[attr.key]?.trim().orEmpty()
            if (raw.isEmpty()) return@forEach
            put(attr.key, if (attr.type == AttributeType.NUMBER) (raw.toDoubleOrNull() ?: raw) else raw)
        }
    }

    fun save() {
        saving = true
        error = null
        scope.launch {
            try {
                devicesVm.update(device.id, buildSpecs(), targetPrice.trim().ifEmpty { null }?.toDoubleOrNull())
                onSaved()
            } catch (e: AppException) {
                saving = false
                error = e.message
            }
        }
    }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Text(t("inventory.editDevice", null), style = MaterialTheme.typography.titleLarge)
        Text(device.imei, style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(16.dp))
        DynamicSpecFields(
            attributes = attrs,
            values = specs,
            onChanged = { k, v -> specs[k] = v },
        )
        AppFormField(
            label = t("inventory.targetPrice", null),
            value = targetPrice,
            onValueChange = { targetPrice = it },
            keyboardType = KeyboardType.Decimal,
        )
        error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.destructive)
        }
        if (!online) {
            Spacer(Modifier.height(12.dp))
            Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        }
        Spacer(Modifier.height(16.dp))
        PillButton(
            text = if (saving) t("common.loading", null) else t("common.save", null),
            onClick = { save() },
            enabled = online && !saving,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
