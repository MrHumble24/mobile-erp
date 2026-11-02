package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.data.SaleFilters
import uz.malika.erp.features.sales.data.SaleStats
import uz.malika.erp.features.sales.data.SalesRepository
import uz.malika.erp.features.sales.data.UserOption
import uz.malika.erp.features.sales.data.Warranty
import uz.malika.erp.shared.lib.PageState

data class SalesListUi(val state: PageState<Sale> = PageState(), val error: String? = null)
data class WarrantyUi(val loading: Boolean = false, val searched: Boolean = false, val result: Warranty? = null)
data class ReceiptUi(val loading: Boolean = false, val error: String? = null, val data: ReceiptData? = null)
data class ReturnUi(val busy: Boolean = false, val error: String? = null, val done: Boolean = false)

/**
 * Sales list (filtered + paginated + stats), the IMEI warranty lookup (online or
 * offline), on-demand receipts, and the online-only return. One ViewModel for the
 * one sales screen.
 */
class SalesViewModel(private val repo: SalesRepository) : ViewModel() {

    private val _list = MutableStateFlow(SalesListUi())
    val list: StateFlow<SalesListUi> = _list.asStateFlow()

    private val _filters = MutableStateFlow(SaleFilters())
    val filters: StateFlow<SaleFilters> = _filters.asStateFlow()

    private val _stats = MutableStateFlow<SaleStats?>(null)
    val stats: StateFlow<SaleStats?> = _stats.asStateFlow()

    private val _cashiers = MutableStateFlow<List<UserOption>>(emptyList())
    val cashiers: StateFlow<List<UserOption>> = _cashiers.asStateFlow()

    private val _warranty = MutableStateFlow(WarrantyUi())
    val warranty: StateFlow<WarrantyUi> = _warranty.asStateFlow()

    private val _receipt = MutableStateFlow(ReceiptUi())
    val receipt: StateFlow<ReceiptUi> = _receipt.asStateFlow()

    private val _ret = MutableStateFlow(ReturnUi())
    val ret: StateFlow<ReturnUi> = _ret.asStateFlow()

    init { refresh() }

    /** Reload from page 1 (replaces the list) and refresh the stats tiles. */
    fun refresh() {
        _filters.value = _filters.value.copy(page = 1)
        _list.value = _list.value.copy(state = _list.value.state.copy(loading = true), error = null)
        viewModelScope.launch {
            try {
                val page = repo.list(_filters.value)
                _list.value = SalesListUi(state = PageState<Sale>().append(page.items, page.total, 1))
            } catch (e: Exception) {
                _list.value = SalesListUi(error = (e as? AppException)?.message ?: "error")
            }
        }
        viewModelScope.launch {
            _stats.value = runCatching { repo.stats(_filters.value) }.getOrNull()
        }
    }

    fun loadMore() {
        val current = _list.value.state
        if (current.loading || !current.hasMore) return
        val next = current.nextPage
        _list.value = _list.value.copy(state = current.copy(loading = true))
        _filters.value = _filters.value.copy(page = next)
        viewModelScope.launch {
            try {
                val page = repo.list(_filters.value)
                _list.value = _list.value.copy(state = _list.value.state.append(page.items, page.total, next))
            } catch (_: Exception) {
                _list.value = _list.value.copy(state = _list.value.state.copy(loading = false))
            }
        }
    }

    fun loadCashiers() {
        if (_cashiers.value.isNotEmpty()) return
        viewModelScope.launch {
            _cashiers.value = runCatching { repo.cashiers() }.getOrDefault(emptyList())
        }
    }

    fun setChannel(channel: SaleChannel?) { _filters.value = _filters.value.copy(channel = channel); refresh() }
    fun setRange(from: String?, to: String?) { _filters.value = _filters.value.copy(from = from, to = to); refresh() }
    fun setSearch(search: String?) { _filters.value = _filters.value.copy(search = search); refresh() }
    fun setReturned(returned: String?) { _filters.value = _filters.value.copy(returned = returned); refresh() }
    fun setWarranty(warranty: String?) { _filters.value = _filters.value.copy(warranty = warranty); refresh() }
    fun setSoldById(id: String?) { _filters.value = _filters.value.copy(soldById = id); refresh() }
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
