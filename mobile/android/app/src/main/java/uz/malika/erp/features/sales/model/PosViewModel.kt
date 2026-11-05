package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.PosRepository
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.ReceiptLineItem
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.data.totalPrice
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.PaymentSplit

/**
 * A resolved scan awaiting the cashier's confirmation. [device] is the looked-up
 * device (null when the code did not resolve); [errorKey] is the i18n key of the
 * reason it cannot be added (null when it is addable). Confirm adds to the cart.
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
) {
    val total: String get() = lines.totalPrice()
}

/**
 * POS terminal state: the multi-device cart, a scan/lookup error (an i18n key),
 * the busy flag, and the completed sale that drives the receipt. Checkout fans
 * the cart into one `sale.create` per device, each enqueued to the outbox, so it
 * works identically online and offline and survives a dropped connection.
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
     * Resolve a scanned IMEI and open a confirmation prompt — it is NOT added to
     * the cart until [confirmScan]. The prompt carries the resolved device and,
     * when it cannot be sold (not found / already queued / duplicate / not in
     * stock), the reason key so the sheet can show it instead of adding silently.
     */
    fun scan(imei: String, online: Boolean) {
        _state.value = _state.value.copy(busy = true, errorKey = null, completed = null, prompt = null)
        viewModelScope.launch {
            try {
                val code = imei.trim()
                val device = repo.lookup(code, online)
                val s = _state.value
                val errorKey = when {
                    device == null -> "common.notFound"
                    s.pendingSold.contains(device.code) -> "pos.alreadyQueued"
                    s.lines.any { it.device.code == device.code } -> "pos.duplicateDevice"
                    !device.inStock -> "pos.deviceConflict"
                    else -> null
                }
                _state.value = s.copy(busy = false, prompt = ScanPrompt(code, device, errorKey))
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    /** Add the prompted device to the cart (only when it is addable) and close the prompt. */
    fun confirmScan() {
        val s = _state.value
        val device = s.prompt?.takeIf { it.addable }?.device ?: return dismissScan()
        _state.value = s.copy(
            prompt = null,
            lines = s.lines + CartLine(
                device = device,
                salePrice = device.targetPrice ?: "",
                warrantyDays = (s.defaultWarrantyDays ?: "").toString(),
            ),
        )
    }

    fun dismissScan() { _state.value = _state.value.copy(prompt = null) }

    fun setLinePrice(code: String, price: String) = mapLine(code) { it.copy(salePrice = price) }
    fun setLineWarranty(code: String, days: String) = mapLine(code) { it.copy(warrantyDays = days) }
    fun removeLine(code: String) {
        _state.value = _state.value.copy(lines = _state.value.lines.filterNot { it.device.code == code })
    }

    private fun mapLine(code: String, f: (CartLine) -> CartLine) {
        _state.value = _state.value.copy(
            lines = _state.value.lines.map { if (it.device.code == code) f(it) else it },
        )
    }

    fun clearError() { _state.value = _state.value.copy(errorKey = null) }
    fun dismissReceipt() { _state.value = _state.value.copy(completed = null) }

    /**
     * [parts] is the cart-level tender (one amount per account, summing to the
     * cart total). It is fanned across the cart lines by [PaymentSplit.allocate]
     * so each sale's payments add up to its own price, and the same parts ride
     * the receipt. Empty parts → the server posts one CASH line per sale.
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
                    PaymentSplit.allocate(lines.map { parseMoney(it.salePrice) }, parts)
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
                        items = lines.map {
                            ReceiptLineItem(it.device.modelLabel, it.device.code, it.salePrice, null)
                        },
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
}
