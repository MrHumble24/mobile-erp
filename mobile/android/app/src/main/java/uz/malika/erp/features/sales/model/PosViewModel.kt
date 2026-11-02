package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.sales.data.PosRepository
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.ReceiptLineItem
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.lib.formatDateTime
import uz.malika.erp.shared.lib.parseMoney

data class PosState(
    val device: ScannedDevice? = null,
    val errorKey: String? = null,
    val busy: Boolean = false,
    val completed: ReceiptData? = null,
    val defaultWarrantyDays: Int? = null,
    val pendingSold: Set<String> = emptySet(),
)

private const val MS_PER_DAY = 86_400_000L

/**
 * POS terminal state: the scanned device, a lookup error (an i18n key), the busy
 * flag, and the completed sale that drives the receipt. Checkout always enqueues
 * to the outbox, so it works identically online and offline.
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

    /** Resolve a scanned IMEI and gate it: exists, IN_STOCK, no pending offline sale. */
    fun scan(imei: String, online: Boolean) {
        _state.value = _state.value.copy(busy = true, errorKey = null, device = null, completed = null)
        viewModelScope.launch {
            try {
                val device = repo.lookup(imei.trim(), online)
                _state.value = when {
                    device == null -> _state.value.copy(busy = false, errorKey = "common.notFound")
                    _state.value.pendingSold.contains(device.imei) ->
                        _state.value.copy(busy = false, errorKey = "pos.alreadyQueued")
                    !device.inStock -> _state.value.copy(busy = false, errorKey = "pos.notInStock")
                    else -> _state.value.copy(busy = false, device = device)
                }
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    fun clear() {
        _state.value = _state.value.copy(device = null, errorKey = null, completed = null)
    }

    fun dismissReceipt() = clear()

    fun checkout(
        salePrice: String,
        online: Boolean,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        warrantyDays: Int? = null,
        notes: String? = null,
    ) {
        val device = _state.value.device ?: return
        _state.value = _state.value.copy(busy = true, errorKey = null)
        viewModelScope.launch {
            try {
                val payload = SaleCreate.payload(
                    imei = device.imei,
                    salePrice = parseMoney(salePrice),
                    customerId = customerId,
                    customerName = customerName,
                    customerPhone = customerPhone,
                    warrantyDays = warrantyDays,
                    notes = notes,
                )
                val mutationId = repo.enqueueSale(payload, baseVersion = device.version)
                val now = System.currentTimeMillis()
                val warrantyUntil = warrantyDays?.let { formatDateTime(now + it * MS_PER_DAY) }
                _state.value = PosState(
                    pendingSold = _state.value.pendingSold,
                    defaultWarrantyDays = _state.value.defaultWarrantyDays,
                    completed = ReceiptData(
                        receiptId = mutationId,
                        soldAt = formatDateTime(now),
                        cashier = cashierName,
                        customerName = customerName?.takeIf { it.isNotBlank() },
                        items = listOf(ReceiptLineItem(device.modelLabel, device.imei, salePrice, null)),
                        total = salePrice,
                        warrantyUntil = warrantyUntil,
                        pending = !online,
                    ),
                )
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }
}
