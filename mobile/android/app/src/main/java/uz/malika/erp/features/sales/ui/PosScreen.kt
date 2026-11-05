package uz.malika.erp.features.sales.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.compose.runtime.collectAsState
import uz.malika.erp.AppContainer
import uz.malika.erp.data.remote.HttpClient
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.sales.data.PosRepository
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.rememberHaptics
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScanConfirmSheet
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.ui.theme.Tokens

/** POS terminal: scan IMEIs into a multi-device cart, then checkout. Offline-capable. */
@Composable
fun PosScreen(container: AppContainer, api: SalesApi) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val vm: PosViewModel = viewModel(
        factory = viewModelFactory {
            initializer {
                val u = container.authRepository.cachedUser()
                val cashier = u?.fullName?.takeIf { it.isNotBlank() } ?: u?.email ?: ""
                PosViewModel(PosRepository(api, container.db, container.outbox, HttpClient.json), cashier)
            }
        },
    )
    val state by vm.state.collectAsState()
    val haptics = rememberHaptics()

    // Cross-feature preload: inventory/QC "Sell in POS" hands us an IMEI to scan.
    LaunchedEffect(Unit) {
        container.featureNav.consumeArg("pos")?.let { vm.scan(it, online) }
    }
    // Toast the checkout result once the receipt is built.
    LaunchedEffect(state.completed?.receiptId) {
        state.completed?.let {
            if (it.pending) {
                container.toaster.info(t("common.offline", null))
            } else {
                container.toaster.success(t("pos.saleSuccess", null))
                haptics.success() // sale completed
            }
        }
    }
    // A scan that resolved to an error (not found / not sellable) is a rejected scan.
    LaunchedEffect(state.prompt?.errorKey) {
        if (state.prompt?.errorKey != null) haptics.error()
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        ScannerField(onScan = { code, _ -> vm.scan(code, online) }, placeholder = t("pos.scanPrompt", null))
        state.errorKey?.let {
            Spacer(Modifier.height(8.dp))
            Text(t(it, null), style = MaterialTheme.typography.bodyMedium, color = Tokens.destructive)
        }
        Spacer(Modifier.height(16.dp))
        when {
            state.busy && state.lines.isEmpty() ->
                Box(Modifier.fillMaxWidth().height(120.dp)) { Loading() }
            state.lines.isEmpty() ->
                EmptyView(t("pos.cartEmpty", null), Modifier.height(220.dp), icon = Icons.Outlined.QrCodeScanner)
            else -> {
                PosCartList(
                    lines = state.lines,
                    onPrice = vm::setLinePrice,
                    onWarranty = vm::setLineWarranty,
                    onRemove = vm::removeLine,
                    enabled = !state.busy,
                )
                Spacer(Modifier.height(16.dp))
                PosCheckoutForm(container, vm, state, online, api)
            }
        }
    }

    state.prompt?.let { prompt ->
        val device = prompt.device
        ScanConfirmSheet(
            code = prompt.code,
            confirmLabel = t("common.add", null),
            cancelLabel = t("common.cancel", null),
            closeLabel = t("common.close", null),
            onConfirm = { vm.confirmScan() },
            onDismiss = { vm.dismissScan() },
            title = device?.modelLabel,
            // When the scan matched the second IMEI, show both so the cashier sees the primary too.
            subtitle = device?.takeIf { !it.imei2.isNullOrBlank() && prompt.code != it.imei }
                ?.let { "IMEI: ${it.imei} · ${t("inventory.imei2", null)}: ${it.imei2}" },
            price = device?.targetPrice,
            statusLabel = device?.let { t(DeviceStatusMeta.labelKey(it.statusCode), null) },
            statusColor = device?.let { DeviceStatusMeta.color(it.statusCode) } ?: Tokens.slate,
            error = prompt.errorKey?.let { t(it, null) },
        )
    }

    state.completed?.let { done ->
        AppBottomSheet(onDismiss = { vm.dismissReceipt() }) {
            PosReceiptSheet(done) { vm.dismissReceipt() }
        }
    }
}

@Composable
private fun PosReceiptSheet(data: ReceiptData, onNewSale: () -> Unit) {
    val t = LocalT.current
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    Column(Modifier.fillMaxWidth().padding(20.dp)) {
        ReceiptPaper(data, t)
        Spacer(Modifier.height(16.dp))
        PillButton(
            text = t("pos.copyCheque", null),
            onClick = {
                clipboard.setText(AnnotatedString(buildReceiptText(t, data)))
                Toast.makeText(context, t("pos.chequeCopied", null), Toast.LENGTH_SHORT).show()
            },
            modifier = Modifier.fillMaxWidth(),
            variant = ButtonVariant.OUTLINE,
        )
        Spacer(Modifier.height(8.dp))
        PillButton(
            text = t("pos.printCheque", null),
            onClick = { printReceiptData(context, t, data) },
            modifier = Modifier.fillMaxWidth(),
            variant = ButtonVariant.OUTLINE,
        )
        Spacer(Modifier.height(8.dp))
        PillButton(t("pos.newSale", null), onNewSale, Modifier.fillMaxWidth())
    }
}
