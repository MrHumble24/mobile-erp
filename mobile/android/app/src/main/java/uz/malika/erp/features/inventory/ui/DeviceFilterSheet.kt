package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.model.FALLBACK_STORAGES
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.FilterSheet

/**
 * Device list filter bottom sheet: model + storage. Status is the metrics bar
 * (kept inline) and IMEI search is the inline scanner field, so neither lives
 * here. Every control applies immediately through the ViewModel; reset clears
 * both via `clearFilters()`.
 */
@Composable
fun DeviceFilterSheet(
    selectedModel: String?,
    selectedStorage: String?,
    models: List<DeviceModelView>,
    canReset: Boolean,
    onModel: (String?) -> Unit,
    onStorage: (String?) -> Unit,
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
        AppSelect(
            value = models.firstOrNull { it.id == selectedModel },
            options = models,
            optionLabel = { it.label },
            onSelect = { onModel(it?.id) },
            label = t("inventory.filterModel", null),
            nullOption = t("inventory.allModels", null),
            modifier = Modifier.fillMaxWidth(),
        )
        AppSelect(
            value = selectedStorage?.takeIf { it in FALLBACK_STORAGES },
            options = FALLBACK_STORAGES,
            optionLabel = { it },
            onSelect = onStorage,
            label = t("inventory.filterStorage", null),
            nullOption = t("inventory.allStorages", null),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
