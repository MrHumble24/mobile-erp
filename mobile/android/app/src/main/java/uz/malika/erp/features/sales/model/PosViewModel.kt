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
import uz.malika.erp.features.sales.data.ReceiptLineItem
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.data.ScanOutcome
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.data.totalPrice
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.PaymentSplit

/**
 * A resolved unit scan awaiting the cashier's confirmation. [device] is the
 * looked-up device (null when it did not resolve); [errorKey] is the i18n key of
 * the reason it cannot be added (null when addable). Confirm adds it to the cart.
 */
data class ScanPrompt(
    val code: String,
    val device: ScannedDevice? = null,
    val errorKey: String? = null,
) {
    val addable: Boolean get() = device != null && errorKey == null
}

data class PosState(
    val lines: List<CartLine> = emptyList(),
    val errorKey: String? = null,
    val busy: Boolean = false,
    val completed: ReceiptData? = null,
    val defaultWarrantyDays: Int? = null,
    val pendingSold: Set<String> = emptySet(),
    val prompt: ScanPrompt? = null,
    /** Quantity products matched by a typed name search, to pick from (ADR 0030). */
    val productMatches: List<CartProduct>? = null,
) {
    val total: String get() = lines.totalPrice()
}

/**
 * POS terminal state: a mixed cart (phones, serial units, quantity products), a
 * scan/lookup error (an i18n key), the busy flag, and the completed sale driving
 * the receipt. Checkout fans the cart into one `sale.create` per line, each
 * enqueued to the outbox, so it works identically online and offline.
 */
class PosViewModel(
    private val repo: PosRepository,
    private val cashierName: String,
) : ViewModel() {

    private val _state = MutableStateFlow(PosState())
    val state: StateFlow<PosState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            repo.watchPendingSoldImeis().collect { imeis ->
                _state.value = _state.value.copy(pendingSold = imeis)
            }
        }
        viewModelScope.launch {
            runCatching { repo.defaultWarrantyDays() }.getOrNull()?.let {
                _state.value = _state.value.copy(defaultWarrantyDays = it)
            }
        }
    }

    /**
     * Resolve a scanned/typed code (ADR 0030). A unit opens the confirm prompt as
     * before. A product barcode is added straight away (re-scan raises the qty).
     * A code that resolves to nothing, when online, falls back to a name search.
     */
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
        val errorKey = when {
            s.pendingSold.contains(device.code) -> "pos.alreadyQueued"
            s.lines.any { it.key == device.code } -> "pos.duplicateDevice"
            !device.inStock -> "pos.deviceConflict"
            else -> null
        }
        _state.value = s.copy(busy = false, prompt = ScanPrompt(code, device, errorKey))
    }

    private suspend fun notFound(code: String, online: Boolean) {
        val matches = if (online) repo.searchProducts(code, online) else emptyList()
        _state.value = _state.value.copy(
            busy = false,
            productMatches = matches.takeIf { it.isNotEmpty() },
            errorKey = if (matches.isEmpty()) "common.notFound" else null,
        )
    }

    /** Add a product line (qty 1), or raise the quantity if it is already in the cart. */
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

    /** Add the prompted device to the cart (only when addable) and close the prompt. */
    fun confirmScan() {
        val s = _state.value
        val device = s.prompt?.takeIf { it.addable }?.device ?: return dismissScan()
        _state.value = s.copy(
            prompt = null,
            lines = s.lines + CartLine.Unit(
                device = device,
                salePrice = device.targetPrice ?: "",
                warrantyDays = (s.defaultWarrantyDays ?: "").toString(),
            ),
        )
    }

    fun dismissScan() { _state.value = _state.value.copy(prompt = null) }

    fun setLinePrice(key: String, price: String) = mapLine(key) {
        when (it) {
            is CartLine.Unit -> it.copy(salePrice = price)
            is CartLine.Quantity -> it.copy(unitPrice = price)
        }
    }

    fun setLineWarranty(key: String, days: String) = mapLine(key) {
        if (it is CartLine.Unit) it.copy(warrantyDays = days) else it
    }

    /** Quantity stepper: at least one piece (removal is a separate action). */
    fun setLineQuantity(key: String, quantity: Int) = mapLine(key) {
        if (it is CartLine.Quantity) it.copy(quantity = quantity.coerceAtLeast(1)) else it
    }

    fun removeLine(key: String) {
        _state.value = _state.value.copy(lines = _state.value.lines.filterNot { it.key == key })
    }

    private fun mapLine(key: String, f: (CartLine) -> CartLine) {
        _state.value = _state.value.copy(
            lines = _state.value.lines.map { if (it.key == key) f(it) else it },
        )
    }

    fun clearError() { _state.value = _state.value.copy(errorKey = null) }
    fun dismissReceipt() { _state.value = _state.value.copy(completed = null) }

    /**
     * [parts] is the cart-level tender (one amount per account, summing to the
     * cart total). It is fanned across the cart lines in order by
     * [PaymentSplit.allocate] so each sale's payments add up to its own line
     * total. Empty parts → the server posts one CASH line per sale.
     */
    fun checkout(
        online: Boolean,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        notes: String? = null,
        parts: List<AccountAmount> = emptyList(),
    ) {
        val lines = _state.value.lines
        if (lines.isEmpty()) return
        _state.value = _state.value.copy(busy = true, errorKey = null)
        viewModelScope.launch {
            try {
                val allocation = if (parts.isEmpty()) {
                    emptyList()
                } else {
                    PaymentSplit.allocate(lines.map { it.lineTotal }, parts)
                }
                val ops = SaleCreate.ops(lines, customerId, customerName, customerPhone, notes, allocation)
                val ids = ops.map { repo.enqueueSale(it.payload, it.baseVersion) }
                _state.value = PosState(
                    pendingSold = _state.value.pendingSold,
                    defaultWarrantyDays = _state.value.defaultWarrantyDays,
                    completed = ReceiptData(
                        receiptId = ids.first(),
                        soldAt = formatDateTime(System.currentTimeMillis()),
                        cashier = cashierName,
                        customerName = customerName?.takeIf { it.isNotBlank() },
                        items = lines.map(::receiptItem),
                        total = lines.totalPrice(),
                        warrantyUntil = null,
                        pending = !online,
                        payments = parts.map { AccountAmount(it.accountCode, it.amount) },
                    ),
                )
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    private fun receiptItem(line: CartLine): ReceiptLineItem = when (line) {
        is CartLine.Unit -> ReceiptLineItem(line.device.modelLabel, line.device.code, line.salePrice, null)
        is CartLine.Quantity ->
            ReceiptLineItem(line.product.label, "", line.lineTotal.toPlainString(), null, quantity = line.quantity)
    }
}
