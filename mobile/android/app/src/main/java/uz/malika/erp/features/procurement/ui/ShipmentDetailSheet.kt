package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.DeviceRowDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.payments.ui.accountLabel
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Shipment summary + its registered devices (paginated), as a phone bottom sheet. */
@Composable
fun ShipmentDetailSheet(
    shipment: ShipmentDto,
    supplierName: String,
    modelNames: Map<String, String>,
    canManage: Boolean,
    canCreate: Boolean,
    repo: ProcurementRepository,
    onEdit: () -> Unit,
    onContinueIntake: () -> Unit,
    onDismiss: () -> Unit,
) {
    AppBottomSheet(onDismiss = onDismiss) {
        ShipmentDetailContent(
            shipment = shipment,
            supplierName = supplierName,
            modelNames = modelNames,
            canManage = canManage,
            canCreate = canCreate,
            repo = repo,
            onEdit = onEdit,
            onContinueIntake = onContinueIntake,
            modifier = Modifier.padding(16.dp),
        )
    }
}

/**
 * The detail body itself — reused as a phone bottom sheet ([ShipmentDetailSheet])
 * and as the tablet master-detail pane. The batch is its own identity (supplier,
 * date, intake progress, phone/customs totals, notes); the registered devices
 * load one page at a time (load-more), surfacing a retriable error if a page fails.
 */
@Composable
fun ShipmentDetailContent(
    shipment: ShipmentDto,
    supplierName: String,
    modelNames: Map<String, String>,
    canManage: Boolean,
    canCreate: Boolean,
    repo: ProcurementRepository,
    onEdit: () -> Unit,
    onContinueIntake: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var devices by remember(shipment.id) { mutableStateOf(PageState<DeviceRowDto>()) }
    var loaded by remember(shipment.id) { mutableStateOf(false) }
    var error by remember(shipment.id) { mutableStateOf<String?>(null) }

    suspend fun load(page: Int) {
        devices = devices.copy(loading = true)
        error = null
        try {
            val dto = repo.devices(shipmentId = shipment.id, page = page)
            devices = devices.append(dto.items, dto.total, page)
        } catch (e: AppException) {
            devices = devices.copy(loading = false)
            error = e.message
        }
        loaded = true
    }

    LaunchedEffect(shipment.id) { load(1) }

    Column(modifier) {
        Text(supplierName, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(4.dp))
        Text(shipment.dateLabel, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(4.dp))
        Text(
            t("shipments.registeredProgress", mapOf("registered" to shipment.deviceCount, "expected" to shipment.expectedCount)),
            style = MaterialTheme.typography.bodySmall,
            color = Tokens.mutedForeground,
        )

        ShipmentMeta(shipment)

        Spacer(Modifier.height(16.dp))
        if (canCreate || canManage) {
            if (canCreate) {
                PillButton(t("shipments.continueIntake", null), onContinueIntake, Modifier.fillMaxWidth())
            }
            if (canCreate && canManage) Spacer(Modifier.height(Tokens.Space.gap))
            if (canManage) {
                PillButton(t("shipments.editShipment", null), onEdit, Modifier.fillMaxWidth(), ButtonVariant.OUTLINE)
            }
            Spacer(Modifier.height(16.dp))
        }

        when {
            !loaded -> Loading()
            error != null -> ErrorView(
                message = error!!,
                retryLabel = t("common.retry", null),
                onRetry = { scope.launch { load(1) } },
            )
            devices.items.isEmpty() -> EmptyView(t("shipments.noDevices", null))
            else -> {
                ShipmentDevicesTable(devices.items, modelNames)
                LoadMoreFooter(
                    hasMore = devices.hasMore,
                    loading = devices.loading,
                    onLoadMore = { scope.launch { load(devices.nextPage) } },
                )
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

/**
 * Paying account, the per-phone expense + customs-fee totals (each shown only
 * when the server sent it — absent for users without the cost permission), the
 * notes, and a warning line when any phone still lacks a customs fee.
 */
@Composable
private fun ShipmentMeta(shipment: ShipmentDto) {
    val t = LocalT.current
    val notes = shipment.notes?.takeIf { it.isNotBlank() }
    val account = shipment.paymentAccountCode
    Spacer(Modifier.height(12.dp))
    Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.rowV)) {
        account?.let { MetaRow(t("balance.payFrom", null)) { Text(accountLabel(it, emptyList(), t), style = MaterialTheme.typography.bodyMedium) } }
        shipment.unitExpenseTotal?.let { MetaRow(t("shipments.unitExpenseTotal", null)) { MoneyText(it, style = MaterialTheme.typography.bodyMedium) } }
        shipment.customsFeeTotal?.let { MetaRow(t("shipments.customsFeeTotal", null)) { MoneyText(it, style = MaterialTheme.typography.bodyMedium) } }
        notes?.let { MetaRow(t("common.notes", null)) { Text(it, style = MaterialTheme.typography.bodyMedium) } }
        if (shipment.devicesWithoutCustomsFee > 0) {
            Text(
                t("shipments.devicesWithoutCustomsFee", mapOf("count" to shipment.devicesWithoutCustomsFee)),
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.warning,
            )
        }
    }
}

/** A label/value meta row: muted label on the left, the caller's value on the right. */
@Composable
private fun MetaRow(label: String, value: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth()) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground, modifier = Modifier.weight(1f))
        value()
    }
}
