package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.unit.dp
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.data.DeviceHistoryEntry
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.inventory.data.PricingRepository
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
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.Tokens

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
    pricingRepo: PricingRepository,
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

    Column(Modifier.fillMaxWidth().heightIn(max = 640.dp).padding(Tokens.Space.gutter)) {
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
                pricingRepo = pricingRepo,
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
    pricingRepo: PricingRepository,
    onClose: () -> Unit,
    onChanged: () -> Unit,
) {
    val t = LocalT.current
    val clipboard = LocalClipboardManager.current
    val canChangeStatus = LocalCan.current("device.status.change")
    val canSell = LocalCan.current("sale.create") && device.statusCode == "IN_STOCK"
    val canInspect = LocalCan.current("qc.create") && device.statusCode in INSPECTABLE
    // Both cost edits work on any status, sold included (ADR 0026/0027).
    val canExpense = LocalCan.current("device.expense")
    val canCustomsFee = LocalCan.current("customs.manage")
    val canManagePrices = LocalCan.current("price.manage")
    var showEdit by remember { mutableStateOf(false) }
    var showExpense by remember { mutableStateOf(false) }
    var showCustomsFee by remember { mutableStateOf(false) }
    var showPrices by remember { mutableStateOf(false) }

    val history by produceState<List<DeviceHistoryEntry>>(emptyList(), device.id) {
        value = runCatching { devicesVm.history(device.id) }.getOrDefault(emptyList())
    }

    Column(Modifier.verticalScroll(rememberScrollState())) {
        Text(
            device.modelLabel.ifEmpty { t("inventory.imeiDetails", null) },
            style = MaterialTheme.typography.titleLarge,
            color = Tokens.text,
        )
        Spacer(Modifier.height(Tokens.Space.sm))
        ImeiCopyRow(if (device.imei != null) "IMEI" else t("catalog.unitCode", null), device.code, clipboard, toaster, t)
        device.imei2?.takeIf { it.isNotBlank() }?.let {
            ImeiCopyRow(t("inventory.imei2", null), it, clipboard, toaster, t)
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        StatusChip(
            label = t(DeviceStatusMeta.labelKey(device.statusCode), null),
            color = DeviceStatusMeta.color(device.statusCode),
        )
        if (canSell || canInspect || canUpdate || canExpense || canCustomsFee || canManagePrices) {
            Spacer(Modifier.height(Tokens.Space.lg))
            // Sell is the one orange; QC is secondary; edit is a ghost link.
            if (canSell) {
                PillButton(
                    text = t("inventory.sellInPos", null),
                    onClick = { featureNav.open(Destination.Pos(device.code)); onClose() },
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(Tokens.Space.sm))
            }
            if (canInspect) {
                PillButton(
                    text = t("qc.runInspection", null),
                    onClick = { featureNav.open(Destination.Qc(device.code)); onClose() },
                    variant = ButtonVariant.SECONDARY,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(Tokens.Space.sm))
            }
            if (canUpdate) {
                PillButton(
                    text = t("inventory.editDevice", null),
                    onClick = { showEdit = true },
                    variant = ButtonVariant.GHOST,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            if (canExpense) {
                Spacer(Modifier.height(Tokens.Space.sm))
                PillButton(
                    text = t("inventory.editUnitExpense", null),
                    onClick = { showExpense = true },
                    variant = ButtonVariant.OUTLINE,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            if (canCustomsFee) {
                Spacer(Modifier.height(Tokens.Space.sm))
                PillButton(
                    text = t("inventory.editCustomsFee", null),
                    onClick = { showCustomsFee = true },
                    variant = ButtonVariant.OUTLINE,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            if (canManagePrices) {
                Spacer(Modifier.height(Tokens.Space.sm))
                PillButton(
                    text = t("pricing.unitPrices", null),
                    onClick = { showPrices = true },
                    variant = ButtonVariant.OUTLINE,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
        Spacer(Modifier.height(Tokens.Space.lg))
        DeviceBarcode(imei = device.code)
        Spacer(Modifier.height(Tokens.Space.lg))
        DeviceSpecsGrid(device = device)
        Spacer(Modifier.height(Tokens.Space.gutter))
        SectionTitle(t("inventory.qcInspection", null))
        QcSummarySection(qc = device.latestInspection)
        Spacer(Modifier.height(Tokens.Space.gutter))
        SectionTitle(t("inventory.history", null))
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
        Spacer(Modifier.height(Tokens.Space.sm))
    }

    DeviceSheetDialogs(
        device = device,
        devicesVm = devicesVm,
        catalogVm = catalogVm,
        online = online,
        toaster = toaster,
        pricingRepo = pricingRepo,
        showEdit = showEdit,
        showExpense = showExpense,
        showCustomsFee = showCustomsFee,
        showPrices = showPrices,
        onDismiss = { showEdit = false; showExpense = false; showCustomsFee = false; showPrices = false },
        onChanged = onChanged,
    )
}
