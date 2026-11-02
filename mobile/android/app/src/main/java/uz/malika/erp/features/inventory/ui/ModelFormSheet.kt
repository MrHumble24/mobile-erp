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
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.AttributeDef
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/**
 * Create / edit a device model with its dynamic attribute schema. Online-only;
 * save is blocked offline. A 409 means a duplicate brand+name.
 */
@Composable
fun ModelFormSheet(
    model: DeviceModelView?,
    catalogVm: CatalogViewModel,
    online: Boolean,
    onSaved: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val isEdit = model != null

    var brand by remember { mutableStateOf(model?.brand ?: "") }
    var name by remember { mutableStateOf(model?.name ?: "") }
    var active by remember { mutableStateOf(model?.isActive ?: true) }
    var attributes by remember { mutableStateOf(model?.attributes ?: emptyList()) }
    val savedKeys = remember { model?.attributes?.map { it.key }?.toSet() ?: emptySet() }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun save() {
        if (brand.isBlank() || name.isBlank()) {
            error = t("common.required", null); return
        }
        saving = true
        error = null
        scope.launch {
            try {
                if (isEdit) {
                    catalogVm.update(model!!.id, brand.trim(), name.trim(), active, attributes)
                } else {
                    catalogVm.create(brand.trim(), name.trim(), attributes)
                }
                onSaved()
            } catch (e: AppException) {
                saving = false
                error = if (e.statusCode == 409) t("inventory.modelDuplicate", null) else e.message
            }
        }
    }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Text(
            t(if (isEdit) "inventory.editModel" else "inventory.newModel", null),
            style = MaterialTheme.typography.titleLarge,
        )
        Spacer(Modifier.height(16.dp))
        AppFormField(label = t("inventory.brand", null), value = brand, onValueChange = { brand = it })
        Spacer(Modifier.height(12.dp))
        AppFormField(label = t("inventory.model", null), value = name, onValueChange = { name = it })
        if (isEdit) {
            Spacer(Modifier.height(12.dp))
            Text(t("inventory.modelActive", null), style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(6.dp))
            SegmentedControl(
                options = listOf(
                    SegmentOption(true, t("common.yes", null)),
                    SegmentOption(false, t("common.no", null)),
                ),
                selected = active,
                onSelect = { active = it },
            )
        }
        Spacer(Modifier.height(12.dp))
        AttributesEditor(
            attributes = attributes,
            savedKeys = savedKeys,
            onChanged = { attributes = it },
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
