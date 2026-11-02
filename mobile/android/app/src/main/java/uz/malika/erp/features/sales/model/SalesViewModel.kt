package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.data.SaleFilters
import uz.malika.erp.features.sales.data.SalesPage
import uz.malika.erp.features.sales.data.SalesRepository
import uz.malika.erp.features.sales.data.Warranty

data class SalesListUi(val loading: Boolean = true, val error: String? = null, val page: SalesPage? = null)
data class WarrantyUi(val loading: Boolean = false, val searched: Boolean = false, val result: Warranty? = null)
data class ReceiptUi(val loading: Boolean = false, val error: String? = null, val data: ReceiptData? = null)
data class ReturnUi(val busy: Boolean = false, val error: String? = null, val done: Boolean = false)

/**
 * Sales list (filtered), the IMEI warranty lookup (online or offline), on-demand
 * receipts, and the online-only return. One ViewModel for the one sales screen.
 */
class SalesViewModel(private val repo: SalesRepository) : ViewModel() {

    private val _list = MutableStateFlow(SalesListUi())
    val list: StateFlow<SalesListUi> = _list.asStateFlow()

    private val _filters = MutableStateFlow(SaleFilters())
    val filters: StateFlow<SaleFilters> = _filters.asStateFlow()

    private val _warranty = MutableStateFlow(WarrantyUi())
    val warranty: StateFlow<WarrantyUi> = _warranty.asStateFlow()

    private val _receipt = MutableStateFlow(ReceiptUi())
    val receipt: StateFlow<ReceiptUi> = _receipt.asStateFlow()

    private val _ret = MutableStateFlow(ReturnUi())
    val ret: StateFlow<ReturnUi> = _ret.asStateFlow()

    init { refresh() }

    fun refresh() {
        _list.value = _list.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                _list.value = SalesListUi(loading = false, page = repo.list(_filters.value))
            } catch (e: Exception) {
                _list.value = SalesListUi(loading = false, error = (e as? AppException)?.message ?: "error")
            }
        }
    }

    fun setChannel(channel: SaleChannel?) { _filters.value = _filters.value.copy(channel = channel); refresh() }
    fun setRange(from: String?, to: String?) { _filters.value = _filters.value.copy(from = from, to = to); refresh() }
    fun clearFilters() { _filters.value = SaleFilters(); refresh() }

    fun lookupWarranty(imei: String, online: Boolean) {
        val code = imei.trim()
        if (code.isEmpty()) return
        _warranty.value = WarrantyUi(loading = true, searched = true)
        viewModelScope.launch {
            val result = try {
                if (online) repo.warrantyOnline(code) else repo.warrantyFromCache(code)
            } catch (_: Exception) {
                null
            }
            _warranty.value = WarrantyUi(loading = false, searched = true, result = result)
        }
    }

    fun clearWarranty() { _warranty.value = WarrantyUi() }

    fun loadReceipt(saleId: String) {
        _receipt.value = ReceiptUi(loading = true)
        viewModelScope.launch {
            try {
                _receipt.value = ReceiptUi(loading = false, data = repo.receipt(saleId))
            } catch (e: Exception) {
                _receipt.value = ReceiptUi(loading = false, error = (e as? AppException)?.message ?: "error")
            }
        }
    }

    fun clearReceipt() { _receipt.value = ReceiptUi() }

    fun submitReturn(
        saleId: String,
        refundAmount: Double,
        deviceToStatusCode: String,
        reason: String?,
        online: Boolean,
    ) {
        if (!online) { _ret.value = ReturnUi(error = "common.offline"); return }
        _ret.value = ReturnUi(busy = true)
        viewModelScope.launch {
            try {
                repo.processReturn(saleId, refundAmount, deviceToStatusCode, reason)
                _ret.value = ReturnUi(done = true)
                clearWarranty()
                refresh()
            } catch (e: Exception) {
                val key = if ((e as? AppException)?.statusCode == 409) "sales.returnConflict"
                else e.message ?: "common.error"
                _ret.value = ReturnUi(error = key)
            }
        }
    }

    fun resetReturn() { _ret.value = ReturnUi() }
}
