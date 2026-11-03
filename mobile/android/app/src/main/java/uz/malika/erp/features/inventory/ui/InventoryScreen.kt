package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.features.inventory.model.InventoryViewModels
import uz.malika.erp.features.inventory.model.StockAlertsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

private enum class InventoryTab { DEVICES, MODELS, ALERTS }

/**
 * The inventory page: Devices / Models / Alerts. Models is shown only with
 * `device.update`; alert-rule writes need `settings.manage`. Mounted behind a
 * `device.read` gate by [uz.malika.erp.features.inventory.InventoryFeature].
 */
@Composable
fun InventoryScreen(container: AppContainer) {
    val t = LocalT.current
    val vms = remember { InventoryViewModels(container) }
    val devicesVm: DevicesViewModel = viewModel(factory = vms.factory)
    val catalogVm: CatalogViewModel = viewModel(factory = vms.factory)
    val alertsVm: StockAlertsViewModel = viewModel(factory = vms.factory)

    val canUpdate = LocalCan.current("device.update")
    val canManage = LocalCan.current("settings.manage")
    val online by container.connectivity.online.collectAsState()

    val tabs = buildList {
        add(SegmentOption(InventoryTab.DEVICES, t("inventory.tabDevices", null)))
        if (canUpdate) add(SegmentOption(InventoryTab.MODELS, t("inventory.tabModels", null)))
        add(SegmentOption(InventoryTab.ALERTS, t("inventory.tabAlerts", null)))
    }
    var selected by rememberSaveable { mutableStateOf(InventoryTab.DEVICES) }
    if (tabs.none { it.value == selected }) selected = InventoryTab.DEVICES

    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(12.dp))
        SegmentedControl(
            options = tabs,
            selected = selected,
            onSelect = { selected = it },
            modifier = Modifier.padding(horizontal = Tokens.Space.screenH),
        )
        Spacer(Modifier.height(8.dp))
        when (selected) {
            InventoryTab.DEVICES -> DevicesTab(
                devicesVm = devicesVm,
                catalogVm = catalogVm,
                alertsVm = alertsVm,
                online = online,
                canUpdate = canUpdate,
                featureNav = container.featureNav,
                toaster = container.toaster,
                onShowAlerts = { selected = InventoryTab.ALERTS },
            )
            InventoryTab.MODELS -> DeviceModelsTab(catalogVm = catalogVm, online = online)
            InventoryTab.ALERTS -> StockAlertsTab(
                alertsVm = alertsVm,
                catalogVm = catalogVm,
                canManage = canManage,
                online = online,
            )
        }
    }
}
