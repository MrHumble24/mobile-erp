package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.data.DeviceHistoryEntry
import uz.malika.erp.features.inventory.model.Async
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.app.FeatureNav
import uz.malika.erp.app.Destination
import uz.malika.erp.app.LocalCan
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.MonoFamily

/**
 * Device detail: resolves the full device online by IMEI (the offline list
 * caches only a subset), then shows specs, QC, history and — when permitted —
 * edit and the manual status-change form.
 */
@Composable
fun DeviceSheet(
    imei: String,
    devicesVm: DevicesViewModel,
    catalogVm: CatalogViewModel,
    online: Boolean,
    canUpdate: Boolean,
    featureNav: FeatureNav,
    toaster: Toaster,
    onClose: () -> Unit,
) {
    val t = LocalT.current
    var reload by remember { mutableIntStateOf(0) }
    val detail by produceState<Async<DeviceDetail>>(Async.Loading, imei, reload) {
        value = Async.Loading
        value = try {
            Async.Data(devicesVm.detail(imei))
        } catch (e: AppException) {
            Async.Error(e.message)
        }
    }

    Column(Modifier.fillMaxWidth().heightIn(max = 640.dp).padding(16.dp)) {
        when (val d = detail) {
            is Async.Loading -> Loading()
            is Async.Error -> EmptyView(message = t("inventory.imeiNotFound", null))
            is Async.Data -> DeviceSheetBody(
                device = d.value,
                devicesVm = devicesVm,
                catalogVm = catalogVm,
                online = online,
                canUpdate = canUpdate,
                featureNav = featureNav,
                toaster = toaster,
                onClose = onClose,
                onChanged = { reload++ },
            )
        }
    }
}

private val INSPECTABLE = setOf("IN_STOCK", "DEFECTIVE")

@Composable
private fun DeviceSheetBody(
    device: DeviceDetail,
    devicesVm: DevicesViewModel,
    catalogVm: CatalogViewModel,
    online: Boolean,
    canUpdate: Boolean,
    featureNav: FeatureNav,
    toaster: Toaster,
    onClose: () -> Unit,
    onChanged: () -> Unit,
) {
    val t = LocalT.current
    val clipboard = LocalClipboardManager.current
    val canChangeStatus = LocalCan.current("device.status.change")
    val canSell = LocalCan.current("sale.create") && device.statusCode == "IN_STOCK"
    val canInspect = LocalCan.current("qc.create") && device.statusCode in INSPECTABLE
    var showEdit by remember { mutableStateOf(false) }

    val history by produceState<List<DeviceHistoryEntry>>(emptyList(), device.id) {
        value = runCatching { devicesVm.history(device.id) }.getOrDefault(emptyList())
    }

    Column(Modifier.verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(
                    device.modelLabel.ifEmpty { t("inventory.imeiDetails", null) },
                    style = MaterialTheme.typography.titleLarge,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "IMEI: ${device.imei}",
                        style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                    )
                    IconButton(onClick = {
                        clipboard.setText(AnnotatedString(device.imei))
                        toaster.success("${t("inventory.imeiCopied", null)}: ${device.imei}")
                    }) {
                        Icon(Icons.Outlined.ContentCopy, contentDescription = t("inventory.copyImei", null))
                    }
                }
            }
            if (canUpdate) {
                PillButton(
                    text = t("inventory.editDevice", null),
                    onClick = { showEdit = true },
                    variant = ButtonVariant.OUTLINE,
                )
            }
        }
        if (canSell || canInspect) {
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (canSell) {
                    PillButton(
                        text = t("inventory.sellInPos", null),
                        onClick = { featureNav.open(Destination.Pos(device.imei)); onClose() },
                        modifier = Modifier.weight(1f),
                    )
                }
                if (canInspect) {
                    PillButton(
                        text = t("qc.runInspection", null),
                        onClick = { featureNav.open(Destination.Qc(device.imei)); onClose() },
                        variant = ButtonVariant.OUTLINE,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        DeviceBarcode(imei = device.imei)
        Spacer(Modifier.height(16.dp))
        DeviceSpecsGrid(device = device)
        Spacer(Modifier.height(16.dp))
        Text(t("inventory.qcInspection", null), style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(8.dp))
        QcSummarySection(qc = device.latestInspection)
        Spacer(Modifier.height(16.dp))
        Text(t("inventory.history", null), style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(8.dp))
        DeviceHistoryList(history = history)
        if (canChangeStatus) {
            StatusChangeForm(
                device = device,
                devicesVm = devicesVm,
                online = online,
                toaster = toaster,
                onChanged = onChanged,
            )
        }
        Spacer(Modifier.height(8.dp))
    }

    if (showEdit) {
        AppBottomSheet(onDismiss = { showEdit = false }) {
            EditDeviceSheet(
                device = device,
                devicesVm = devicesVm,
                catalogVm = catalogVm,
                online = online,
                onSaved = { showEdit = false; onChanged() },
            )
        }
    }
}
