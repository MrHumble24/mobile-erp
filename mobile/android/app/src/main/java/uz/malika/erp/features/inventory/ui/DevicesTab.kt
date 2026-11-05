package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import uz.malika.erp.app.FeatureNav
import uz.malika.erp.features.inventory.data.DeviceListItem
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.inventory.data.PricingRepository
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.features.inventory.model.StockAlertsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.FilterButton
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** At/above this width the device detail is a side pane, not a bottom sheet. */
private const val TABLET_MIN_DP = 720

/** Offline-first device list with metrics, scan/search, filters and adaptive detail. */
@Composable
fun DevicesTab(
    devicesVm: DevicesViewModel,
    catalogVm: CatalogViewModel,
    alertsVm: StockAlertsViewModel,
    online: Boolean,
    canUpdate: Boolean,
    featureNav: FeatureNav,
    toaster: Toaster,
    pricingRepo: PricingRepository,
    onShowAlerts: () -> Unit,
) {
    val t = LocalT.current
    val filter by devicesVm.filter.collectAsState()
    val list by devicesVm.filtered.collectAsState()
    val metrics by devicesVm.metrics.collectAsState()
    val lowStock by alertsVm.lowStock.collectAsState()
    val models = catalogVm.models.collectAsState().value.valueOrNull ?: emptyList()
    var openImei by remember { mutableStateOf<String?>(null) }
    var showFilters by remember { mutableStateOf(false) }
    val activeFilters = listOf(filter.modelId != null, filter.storage != null).count { it }

    // Incoming cross-feature arg (e.g. another screen opening a device) seeds the sheet.
    LaunchedEffect(Unit) { featureNav.consumeArg("inventory")?.let { openImei = it } }

    val detail: @Composable (String, () -> Unit) -> Unit = { imei, onClose ->
        DeviceSheet(
            imei = imei,
            devicesVm = devicesVm,
            catalogVm = catalogVm,
            online = online,
            canUpdate = canUpdate,
            featureNav = featureNav,
            toaster = toaster,
            pricingRepo = pricingRepo,
            onClose = onClose,
        )
    }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        val wide = maxWidth >= TABLET_MIN_DP.dp
        Column(Modifier.fillMaxSize()) {
            // Full-bleed: the metrics row scrolls edge-to-edge with its own gutter.
            InventoryMetricsBar(
                metrics = metrics,
                lowStockCount = lowStock.size,
                selectedStatus = filter.statusCode,
                onSelectStatus = devicesVm::setStatus,
                onToggleStatus = devicesVm::toggleStatus,
                onShowAlerts = onShowAlerts,
            )
            Spacer(Modifier.height(Tokens.Space.md))
            Column(Modifier.weight(1f).padding(horizontal = Tokens.Space.screenH)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.weight(1f)) {
                        ScannerField(
                            onScan = { code, _ -> devicesVm.setSearch(code) },
                            placeholder = t("inventory.scanOrSearch", null),
                            autofocus = false,
                        )
                    }
                    Spacer(Modifier.width(Tokens.Space.gap))
                    FilterButton(activeCount = activeFilters, onClick = { showFilters = true })
                }
                Spacer(Modifier.height(Tokens.Space.gap))
                Box(Modifier.weight(1f).fillMaxWidth()) {
                    if (wide) {
                        Row(Modifier.fillMaxSize()) {
                            Box(Modifier.weight(1f).fillMaxHeight()) {
                                DeviceList(list, t("inventory.empty", null)) { openImei = it }
                            }
                            Box(Modifier.weight(1.3f).fillMaxHeight()) {
                                val sel = openImei
                                if (sel == null) EmptyView(message = t("inventory.selectDevice", null))
                                else detail(sel) { openImei = null }
                            }
                        }
                    } else {
                        DeviceList(list, t("inventory.empty", null)) { openImei = it }
                    }
                }
            }
        }

        if (!wide) {
            openImei?.let { imei ->
                AppBottomSheet(onDismiss = { openImei = null }) { detail(imei) { openImei = null } }
            }
        }
    }

    if (showFilters) {
        DeviceFilterSheet(
            selectedModel = filter.modelId,
            selectedStorage = filter.storage,
            models = models,
            canReset = activeFilters > 0,
            onModel = devicesVm::setModel,
            onStorage = devicesVm::setStorage,
            onReset = devicesVm::clearFilters,
            onDismiss = { showFilters = false },
        )
    }
}

@Composable
private fun DeviceList(list: List<DeviceListItem>, emptyMessage: String, onOpen: (String) -> Unit) {
    if (list.isEmpty()) {
        EmptyView(message = emptyMessage)
        return
    }
    LazyColumn(verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg), contentPadding = listBottomPadding()) {
        items(list, key = { it.id }) { device ->
            DeviceRow(device = device, onClick = { onOpen(device.code) })
        }
    }
}

@Composable
private fun DeviceRow(device: DeviceListItem, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(device.modelLabel.ifEmpty { device.code }, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                val suffix = device.storage?.let { " · $it" } ?: ""
                Text(
                    device.code + suffix,
                    style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily),
                    color = Tokens.text,
                )
                device.imei2?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.muted)
                }
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            StatusChip(
                label = t(DeviceStatusMeta.labelKey(device.statusCode), null),
                color = DeviceStatusMeta.color(device.statusCode),
            )
        }
    }
}
