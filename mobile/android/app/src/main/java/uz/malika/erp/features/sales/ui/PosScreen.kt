package uz.malika.erp.features.sales.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
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
import uz.malika.erp.app.LocalCan
import uz.malika.erp.data.remote.HttpClient
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.sales.data.PosRepository
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.data.TillCatalogApi
import uz.malika.erp.features.sales.data.TillCatalogRepository
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.features.sales.model.TillCatalogViewModel
import uz.malika.erp.features.shifts.data.ShiftApi
import uz.malika.erp.features.shifts.data.ShiftRepository
import uz.malika.erp.features.shifts.model.ShiftViewModel
import uz.malika.erp.features.shifts.ui.CloseShiftSheet
import uz.malika.erp.features.shifts.ui.OpenShiftSheet
import uz.malika.erp.features.shifts.ui.ShiftBar
import uz.malika.erp.features.shifts.ui.ShiftReportSheet
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.rememberHaptics
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScanConfirmSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/** Till mode: scan a code, or browse the product catalog. Remembered per device. */
enum class PosMode { SCAN, CATALOG }

private const val POS_MODE_KEY = "pos_mode"

/**
 * POS terminal. Two modes feed one cart (ADR 0031): **Scan** (today's screen)
 * and **Catalog** (a grid of product cards). The chosen mode is remembered on
 * the device. In Catalog mode a persistent cart bar opens the cart + checkout so
 * the cart stays reachable without scrolling past the grid. Offline-capable.
 */
@Composable
fun PosScreen(container: AppContainer, api: SalesApi) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val canOverride = LocalCan.current("sale.price.override")
    val canUnlimited = LocalCan.current("sale.discount.unlimited")
    val vm: PosViewModel = viewModel(
        factory = viewModelFactory {
            initializer {
                val u = container.authRepository.cachedUser()
                val cashier = u?.fullName?.takeIf { it.isNotBlank() } ?: u?.email ?: ""
                PosViewModel(
                    PosRepository(api, container.db, container.outbox, HttpClient.json),
                    cashier,
                    canOverride = canOverride,
                    canUnlimited = canUnlimited,
                )
            }
        },
    )
    val catalogVm: TillCatalogViewModel = viewModel(
        factory = viewModelFactory {
            initializer {
                val catalogApi = container.retrofit.create(TillCatalogApi::class.java)
                TillCatalogViewModel(TillCatalogRepository(catalogApi, container.db))
            }
        },
    )
    val state by vm.state.collectAsState()
    val haptics = rememberHaptics()
    val baseUrl = container.devConfig.currentBaseUrl

    val shiftVm: ShiftViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ShiftViewModel(ShiftRepository(container.retrofit.create(ShiftApi::class.java), container.secure)) }
        },
    )
    val shiftState by shiftVm.state.collectAsState()

    var mode by remember { mutableStateOf(readMode(container)) }
    var cartOpen by remember { mutableStateOf(false) }
    var openShiftSheet by remember { mutableStateOf(false) }
    var closeShiftSheet by remember { mutableStateOf(false) }

    // Shifts gate (ADR 0036): the server lets offline replays through, so the app
    // must block selling when online + shifts on + no open shift. Offline follows
    // the last-known state.
    LaunchedEffect(online, state.shiftsEnabled) { if (state.shiftsEnabled) shiftVm.load(online) }
    val shiftBlocked = state.shiftsEnabled &&
        (if (online) shiftState.current == null else shiftState.lastKnownOpen != true)
    val requestOpenShift: () -> Unit = { openShiftSheet = true }

    // Cross-feature preload: inventory/QC "Sell in POS" hands us an IMEI to scan.
    LaunchedEffect(Unit) {
        container.featureNav.consumeArg("pos")?.let { mode = PosMode.SCAN; vm.scan(it, online) }
    }
    // Discount settings follow the connection (online fetch + cache, else last-known).
    LaunchedEffect(online) { vm.loadDiscountSettings(online) }
    // Toast the checkout result once the receipt is built; close the cart sheet.
    LaunchedEffect(state.completed?.receiptId) {
        state.completed?.let {
            cartOpen = false
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

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            SegmentedControl(
                options = listOf(
                    SegmentOption(PosMode.SCAN, t("catalog.scanMode", null), Icons.Outlined.QrCodeScanner),
                    SegmentOption(PosMode.CATALOG, t("catalog.catalogMode", null), Icons.Outlined.GridView),
                ),
                selected = mode,
                onSelect = { mode = it; container.secure.put(POS_MODE_KEY, it.name) },
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 8.dp),
            )
            if (state.shiftsEnabled) {
                ShiftBar(
                    state = shiftState,
                    onOpen = { openShiftSheet = true },
                    onClose = { shiftVm.load(online); closeShiftSheet = true },
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 8.dp),
                )
            }
            when (mode) {
                PosMode.SCAN -> ScanModePanel(container, vm, state, online, api, shiftBlocked, requestOpenShift, Modifier.weight(1f))
                PosMode.CATALOG ->
                    CatalogModePanel(container, catalogVm, vm, state, online, baseUrl, Modifier.weight(1f))
            }
        }
        if (mode == PosMode.CATALOG && state.lines.isNotEmpty()) {
            CartBar(
                lineCount = state.lines.size,
                total = state.total,
                onOpen = { cartOpen = true },
                modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
            )
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

    state.productMatches?.let { matches ->
        AppBottomSheet(onDismiss = { vm.dismissProductMatches() }) {
            ProductPickSheet(matches, onPick = { vm.addProduct(it) })
        }
    }

    if (cartOpen && state.lines.isNotEmpty()) {
        AppBottomSheet(onDismiss = { cartOpen = false }) {
            CartSheet(container, vm, state, online, api, shiftBlocked, requestOpenShift)
        }
    }

    if (openShiftSheet) {
        OpenShiftSheet(
            state = shiftState,
            onOpen = { count -> shiftVm.openShift(count) { openShiftSheet = false } },
            onDismiss = { openShiftSheet = false; shiftVm.clearError() },
        )
    }
    if (closeShiftSheet) {
        CloseShiftSheet(
            state = shiftState,
            current = shiftState.current,
            onClose = { count, note -> shiftVm.closeShift(count, note) { closeShiftSheet = false } },
            onDismiss = { closeShiftSheet = false; shiftVm.clearError() },
        )
    }
    shiftState.closedReport?.let { report ->
        AppBottomSheet(onDismiss = { shiftVm.dismissClosedReport() }) {
            ShiftReportSheet(report)
        }
    }

    state.completed?.let { done ->
        AppBottomSheet(onDismiss = { vm.dismissReceipt() }) {
            PosReceiptSheet(done) { vm.dismissReceipt() }
        }
    }
}

/** The till mode remembered on the device; defaults to Scan. */
private fun readMode(container: AppContainer): PosMode =
    runCatching { PosMode.valueOf(container.secure.get(POS_MODE_KEY) ?: "") }.getOrDefault(PosMode.SCAN)

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
