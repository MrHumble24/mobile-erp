package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.CartProduct
import uz.malika.erp.features.sales.data.PosRepository
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.data.ScanOutcome
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.lib.fromCents
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.PaymentSplit

/**
 * POS terminal logic (ADR 0030/0031/0034): a mixed cart, a price level that
 * follows the customer, per-line and whole-cart discounts bounded by the owner's
 * limit, and the completed sale. Checkout fans the cart into one `sale.create`
 * per line (each carrying its level, discount and the till's list price), enqueued
 * to the outbox so it works identically online and offline.
 */
class PosViewModel(
    internal val repo: PosRepository,
    internal val cashierName: String,
    canOverride: Boolean = false,
    canUnlimited: Boolean = false,
    canTradeIn: Boolean = false,
) : ViewModel() {

    internal val _state = MutableStateFlow(PosState(canOverride = canOverride, canUnlimited = canUnlimited, canTradeIn = canTradeIn))
    val state: StateFlow<PosState> = _state.asStateFlow()

    /** The running customer-bonus lookup (PosBonus.kt): a newer one cancels it. */
    internal var bonusJob: kotlinx.coroutines.Job? = null

    init {
        viewModelScope.launch {
            repo.watchPendingSoldImeis().collect { imeis -> _state.value = _state.value.copy(pendingSold = imeis) }
        }
        viewModelScope.launch {
            runCatching { repo.defaultWarrantyDays() }.getOrNull()?.let {
                _state.value = _state.value.copy(defaultWarrantyDays = it)
            }
        }
    }

    /** Load the till settings (online fetch + cache, else last-known). Driven by PosScreen. */
    fun loadDiscountSettings(online: Boolean) {
        viewModelScope.launch {
            val ts = repo.tillSettings(online)
            _state.value = _state.value.copy(
                settings = ts.discount,
                creditEnabled = ts.creditEnabled,
                shiftsEnabled = ts.shiftsEnabled,
                bonusEnabled = ts.bonusEnabled,
                tillSettingsLoaded = true,
                receiptPrintingEnabled = ts.receiptPrintingEnabled,
                receiptPaperWidthMm = ts.receiptPaperWidthMm,
                storeName = ts.storeName,
                storeAddress = ts.storeAddress,
                storePhone = ts.storePhone,
                receiptFooter = ts.receiptFooter,
            )
        }
    }

    fun scan(raw: String, online: Boolean) {
        _state.value = _state.value.copy(busy = true, errorKey = null, completed = null, prompt = null, productMatches = null)
        viewModelScope.launch {
            try {
                val code = raw.trim()
                when (val outcome = repo.scan(code, online)) {
                    is ScanOutcome.Unit -> promptUnit(code, outcome.device)
                    is ScanOutcome.Product -> addProduct(outcome.product)
                    ScanOutcome.NotFound -> notFound(code, online)
                }
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    private fun promptUnit(code: String, device: ScannedDevice) {
        val s = _state.value
        _state.value = s.copy(busy = false, prompt = ScanPrompt(code, device, unitErrorKey(s, device)))
    }

    private fun unitErrorKey(s: PosState, device: ScannedDevice): String? = when {
        s.pendingSold.contains(device.code) -> "pos.alreadyQueued"
        s.lines.any { it.key == device.code } -> "pos.duplicateDevice"
        !device.inStock -> "pos.deviceConflict"
        else -> null
    }

    fun addUnitFromCatalog(code: String, online: Boolean) {
        _state.value = _state.value.copy(busy = true, errorKey = null)
        viewModelScope.launch {
            try {
                when (val outcome = repo.scan(code, online)) {
                    is ScanOutcome.Unit -> addResolvedUnit(outcome.device)
                    else -> _state.value = _state.value.copy(busy = false, errorKey = "common.notFound")
                }
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    private fun addResolvedUnit(device: ScannedDevice) {
        val s = _state.value
        val errorKey = unitErrorKey(s, device)
        if (errorKey != null) {
            _state.value = s.copy(busy = false, errorKey = errorKey)
            return
        }
        _state.value = s.copy(busy = false, lines = s.lines + newUnitLine(device, s))
    }

    private fun notFound(code: String, online: Boolean) {
        viewModelScope.launch {
            val matches = if (online) repo.searchProducts(code, online) else emptyList()
            _state.value = _state.value.copy(
                busy = false,
                productMatches = matches.takeIf { it.isNotEmpty() },
                errorKey = if (matches.isEmpty()) "common.notFound" else null,
            )
        }
    }

    fun addProduct(product: CartProduct) {
        val s = _state.value
        val key = "model:${product.modelId}"
        val lines = if (s.lines.any { it.key == key }) {
            s.lines.map { if (it is CartLine.Quantity && it.key == key) it.copy(quantity = it.quantity + 1) else it }
        } else {
            s.lines + CartLine.Quantity(product, quantity = 1, unitPrice = product.salePrice ?: "")
        }
        _state.value = s.copy(busy = false, lines = lines, productMatches = null)
    }

    fun dismissProductMatches() { _state.value = _state.value.copy(productMatches = null) }

    fun confirmScan() {
        val s = _state.value
        val device = s.prompt?.takeIf { it.addable }?.device ?: return dismissScan()
        _state.value = s.copy(prompt = null, lines = s.lines + newUnitLine(device, s))
    }

    private fun newUnitLine(device: ScannedDevice, s: PosState) = CartLine.Unit(
        device = device,
        salePrice = device.targetPrice ?: "",
        warrantyDays = (s.defaultWarrantyDays ?: "").toString(),
    )

    fun dismissScan() { _state.value = _state.value.copy(prompt = null) }

    fun clearError() { _state.value = _state.value.copy(errorKey = null) }
    fun dismissReceipt() { _state.value = _state.value.copy(completed = null) }

    /** Empty the cart, keeping settings/flags — used after an "On credit" sale (ADR 0035). */
    fun resetCart() {
        _state.value = _state.value.cleared()
    }

    /**
     * [parts] is the cart-level tender summing to the amount to pay; it is fanned
     * across the lines' final prices so each sale's payments add up to its line.
     */
    fun checkout(
        online: Boolean,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        notes: String? = null,
        parts: List<AccountAmount> = emptyList(),
    ) {
        val s = _state.value
        val priced = s.priced
        if (priced.lines.isEmpty()) return
        priced.rejection?.let { _state.value = s.copy(errorKey = it.key); return }
        _state.value = s.copy(busy = true, errorKey = null)
        viewModelScope.launch {
            try {
                val finals = priced.lines.map { it.finalPrice }
                val allocation = if (parts.isEmpty()) emptyList() else PaymentSplit.allocate(finals, parts)
                val ops = SaleCreate.ops(priced.lines, s.level, customerId, customerName, customerPhone, notes, allocation)
                val ids = ops.map { repo.enqueueSale(it.payload, it.baseVersion) }
                val pointsSpent = s.bonusPlan.totalCents.fromCents().takeIf { it.signum() > 0 }?.toPlainString()
                _state.value = s.cleared(completed = buildPosReceipt(
                    ids.first(), cashierName, s.level, priced, online, customerName, parts,
                    storeName = s.storeName, storeAddress = s.storeAddress, storePhone = s.storePhone,
                    footer = s.receiptFooter, pointsSpent = pointsSpent,
                ))
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }
}
