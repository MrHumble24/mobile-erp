package uz.malika.erp.features.sales.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import uz.malika.erp.features.sales.data.PosRepository
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** POS terminal: scan an IMEI, review the device, checkout. Offline-capable. */
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

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Text(t("pos.title", null), style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))
        ScannerField(onScan = { vm.scan(it, online) }, placeholder = t("pos.scanPrompt", null))
        Spacer(Modifier.height(16.dp))
        when {
            state.busy && state.device == null ->
                Box(Modifier.fillMaxWidth().height(120.dp)) { Loading() }
            state.errorKey != null ->
                EmptyView(t(state.errorKey!!, null), Modifier.height(220.dp), icon = Icons.Outlined.QrCodeScanner)
            state.device == null ->
                EmptyView(t("pos.cartEmpty", null), Modifier.height(220.dp), icon = Icons.Outlined.QrCodeScanner)
            else -> {
                PosCartCard(state.device!!, t)
                Spacer(Modifier.height(16.dp))
                PosCheckoutForm(vm, state, online, container, api)
            }
        }
    }

    state.completed?.let { done ->
        AppBottomSheet(onDismiss = { vm.dismissReceipt() }) {
            PosReceiptSheet(done) { vm.dismissReceipt() }
        }
    }
}

@Composable
private fun PosCartCard(device: ScannedDevice, t: uz.malika.erp.i18n.Translate) {
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth()) {
            Text(t("pos.deviceCard", null), style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
            StatusChip(device.statusCode, color = Tokens.success)
        }
        Spacer(Modifier.height(8.dp))
        Text(device.modelLabel, style = MaterialTheme.typography.titleMedium)
        Text(device.imei, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily))
        device.targetPrice?.let {
            Spacer(Modifier.height(8.dp))
            Text(formatMoney(it), style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily))
        }
    }
}

@Composable
private fun PosReceiptSheet(data: ReceiptData, onNewSale: () -> Unit) {
    val t = LocalT.current
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    Column(Modifier.fillMaxWidth().padding(20.dp)) {
        if (data.pending) {
            StatusChip(t("common.offline", null), color = Tokens.warning)
            Spacer(Modifier.height(12.dp))
        }
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
