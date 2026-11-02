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
import uz.malika.erp.features.sales.data.totalPrice
import uz.malika.erp.features.sales.lib.formatDateTime

data class PosState(
    val lines: List<CartLine> = emptyList(),
    val errorKey: String? = null,
    val busy: Boolean = false,
    val completed: ReceiptData? = null,
    val defaultWarrantyDays: Int? = null,
    val pendingSold: Set<String> = emptySet(),
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

    /** Resolve a scanned IMEI and add it to the cart: exists, IN_STOCK, not already queued or carted. */
    fun scan(imei: String, online: Boolean) {
        _state.value = _state.value.copy(busy = true, errorKey = null, completed = null)
        viewModelScope.launch {
            try {
                val device = repo.lookup(imei.trim(), online)
                val s = _state.value
                _state.value = when {
                    device == null -> s.copy(busy = false, errorKey = "common.notFound")
                    s.pendingSold.contains(device.imei) -> s.copy(busy = false, errorKey = "pos.duplicateDevice")
                    s.lines.any { it.device.imei == device.imei } ->
                        s.copy(busy = false, errorKey = "pos.duplicateDevice")
                    !device.inStock -> s.copy(busy = false, errorKey = "pos.notInStock")
                    else -> s.copy(
                        busy = false,
                        errorKey = null,
                        lines = s.lines + CartLine(
                            device = device,
                            salePrice = device.targetPrice ?: "",
                            warrantyDays = (s.defaultWarrantyDays ?: "").toString(),
                        ),
                    )
                }
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    fun setLinePrice(imei: String, price: String) = mapLine(imei) { it.copy(salePrice = price) }
    fun setLineWarranty(imei: String, days: String) = mapLine(imei) { it.copy(warrantyDays = days) }
    fun removeLine(imei: String) {
        _state.value = _state.value.copy(lines = _state.value.lines.filterNot { it.device.imei == imei })
    }

    private fun mapLine(imei: String, f: (CartLine) -> CartLine) {
        _state.value = _state.value.copy(
            lines = _state.value.lines.map { if (it.device.imei == imei) f(it) else it },
        )
    }

    fun clearError() { _state.value = _state.value.copy(errorKey = null) }
    fun dismissReceipt() { _state.value = _state.value.copy(completed = null) }

    fun checkout(
        online: Boolean,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        notes: String? = null,
    ) {
        val lines = _state.value.lines
        if (lines.isEmpty()) return
        _state.value = _state.value.copy(busy = true, errorKey = null)
        viewModelScope.launch {
            try {
                val ops = SaleCreate.ops(lines, customerId, customerName, customerPhone, notes)
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
                            ReceiptLineItem(it.device.modelLabel, it.device.imei, it.salePrice, null)
                        },
                        total = lines.totalPrice(),
                        warrantyUntil = null,
                        pending = !online,
                    ),
                )
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }
}
