package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import uz.malika.erp.features.inventory.data.DeviceListItem
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.features.inventory.model.FALLBACK_STORAGES
import uz.malika.erp.features.inventory.model.StockAlertsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily

/** Offline-first device list with metrics, scan/search and model/storage filters. */
@Composable
fun DevicesTab(
    devicesVm: DevicesViewModel,
    catalogVm: CatalogViewModel,
    alertsVm: StockAlertsViewModel,
    online: Boolean,
    canUpdate: Boolean,
    onShowAlerts: () -> Unit,
) {
    val t = LocalT.current
    val filter by devicesVm.filter.collectAsState()
    val list by devicesVm.filtered.collectAsState()
    val metrics by devicesVm.metrics.collectAsState()
    val lowStock by alertsVm.lowStock.collectAsState()
    val models = catalogVm.models.collectAsState().value.valueOrNull ?: emptyList()
    var openImei by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize()) {
        InventoryMetricsBar(
            metrics = metrics,
            lowStockCount = lowStock.size,
            selectedStatus = filter.statusCode,
            onSelectStatus = devicesVm::setStatus,
            onToggleStatus = devicesVm::toggleStatus,
            onShowAlerts = onShowAlerts,
        )
        Spacer(Modifier.height(12.dp))
        ScannerField(
            onScan = devicesVm::setSearch,
            placeholder = t("inventory.scanOrSearch", null),
            autofocus = false,
        )
        Spacer(Modifier.height(8.dp))
        FilterRow(
            selectedModel = filter.modelId,
            selectedStorage = filter.storage,
            models = models,
            isEmpty = filter.isEmpty,
            onModel = devicesVm::setModel,
            onStorage = devicesVm::setStorage,
            onClear = devicesVm::clear,
        )
        Spacer(Modifier.height(8.dp))
        Box(Modifier.weight(1f).fillMaxWidth()) {
            if (list.isEmpty()) {
                EmptyView(message = t("inventory.empty", null))
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(list, key = { it.id }) { device ->
                        DeviceRow(device = device, onClick = { openImei = device.imei })
                    }
                }
            }
        }
    }

    openImei?.let { imei ->
        AppBottomSheet(onDismiss = { openImei = null }) {
            DeviceSheet(
                imei = imei,
                devicesVm = devicesVm,
                catalogVm = catalogVm,
                online = online,
                canUpdate = canUpdate,
            )
        }
    }
}

@Composable
private fun FilterRow(
    selectedModel: String?,
    selectedStorage: String?,
    models: List<DeviceModelView>,
    isEmpty: Boolean,
    onModel: (String?) -> Unit,
    onStorage: (String?) -> Unit,
    onClear: () -> Unit,
) {
    val t = LocalT.current
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Bottom,
    ) {
        AppSelect(
            value = models.firstOrNull { it.id == selectedModel },
            options = models,
            optionLabel = { it.label },
            onSelect = { onModel(it?.id) },
            label = t("inventory.filterModel", null),
            nullOption = t("inventory.allModels", null),
            modifier = Modifier.weight(1f),
        )
        AppSelect(
            value = selectedStorage?.takeIf { it in FALLBACK_STORAGES },
            options = FALLBACK_STORAGES,
            optionLabel = { it },
            onSelect = onStorage,
            label = t("inventory.filterStorage", null),
            nullOption = t("inventory.allStorages", null),
            modifier = Modifier.weight(1f),
        )
    }
    if (!isEmpty) {
        Spacer(Modifier.height(8.dp))
        PillButton(
            text = t("inventory.clearFilters", null),
            onClick = onClear,
            variant = ButtonVariant.GHOST,
        )
    }
}

@Composable
private fun DeviceRow(device: DeviceListItem, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(device.modelLabel, style = MaterialTheme.typography.titleMedium)
                val suffix = device.storage?.let { " · $it" } ?: ""
                Text(
                    device.imei + suffix,
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                )
            }
            StatusChip(
                label = t(DeviceStatusMeta.labelKey(device.statusCode), null),
                color = DeviceStatusMeta.color(device.statusCode),
            )
        }
    }
}
