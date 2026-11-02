package uz.malika.erp.features.inventory.ui
import uz.malika.erp.shared.ui.AppSelect

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
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.StockAlertRuleView
import uz.malika.erp.features.inventory.model.FALLBACK_STORAGES
import uz.malika.erp.features.inventory.model.StockAlertsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Create / edit a stock-alert rule. On edit the model is fixed (the PATCH only
 * changes storage + threshold). Online-only; blocked offline.
 */
@Composable
fun AlertRuleForm(
    rule: StockAlertRuleView?,
    alertsVm: StockAlertsViewModel,
    models: List<DeviceModelView>,
    online: Boolean,
    onSaved: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val isEdit = rule != null

    var modelId by remember { mutableStateOf(rule?.modelId) }
    var storage by remember { mutableStateOf(rule?.storage) }
    var threshold by remember { mutableStateOf("${rule?.threshold ?: 1}") }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val storages = remember(modelId, models) {
        val opts = models.firstOrNull { it.id == modelId }
            ?.attributes?.firstOrNull { it.key == "storage" }?.options ?: emptyList()
        opts.ifEmpty { FALLBACK_STORAGES }
    }

    fun save() {
        val m = modelId
        val s = storage
        val th = threshold.trim().toIntOrNull()
        if (m == null || s == null || th == null || th < 0) {
            error = t("common.required", null); return
        }
        saving = true
        error = null
        scope.launch {
            try {
                if (isEdit) alertsVm.update(rule!!.id, s, th) else alertsVm.create(m, s, th)
                onSaved()
            } catch (e: AppException) {
                saving = false
                error = e.message
            }
        }
    }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Text(
            t(if (isEdit) "inventory.editRule" else "inventory.newRule", null),
            style = MaterialTheme.typography.titleLarge,
        )
        Spacer(Modifier.height(16.dp))
        AppSelect(
            value = models.firstOrNull { it.id == modelId },
            options = models,
            optionLabel = { it.label },
            onSelect = { modelId = it?.id },
            label = t("inventory.model", null),
            enabled = !isEdit,
        )
        Spacer(Modifier.height(12.dp))
        AppSelect(
            value = storage?.takeIf { it in storages },
            options = storages,
            optionLabel = { it },
            onSelect = { storage = it },
            label = t("inventory.storage", null),
        )
        Spacer(Modifier.height(12.dp))
        AppFormField(
            label = t("inventory.threshold", null),
            value = threshold,
            onValueChange = { threshold = it },
            keyboardType = KeyboardType.Number,
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
