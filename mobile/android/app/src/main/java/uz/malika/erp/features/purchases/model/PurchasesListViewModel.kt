package uz.malika.erp.features.purchases.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.purchases.data.CustomerPurchaseDto
import uz.malika.erp.features.purchases.data.PurchaseFilters
import uz.malika.erp.features.purchases.data.PurchaseRepository
import uz.malika.erp.shared.ui.DateRange

data class PurchasesListState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<CustomerPurchaseDto> = emptyList(),
)

/**
 * The customer-purchases list (ADR 0039): newest first, with a date range and an
 * exact IMEI/serial search. Online only (`/customer-purchases` has no offline feed).
 */
class PurchasesListViewModel(private val repo: PurchaseRepository) : ViewModel() {

    private val _range = MutableStateFlow(DateRange())
    val range = _range.asStateFlow()

    private val _search = MutableStateFlow("")
    val search = _search.asStateFlow()

    private val _state = MutableStateFlow(PurchasesListState())
    val state = _state.asStateFlow()

    init { reload() }

    fun setRange(range: DateRange) { _range.value = range; reload() }
    fun setSearch(q: String) { _search.value = q; reload() }
    fun refresh() = reload()

    private fun fromIso(): String? = _range.value.startMillis?.let { "${isoDay(it)}T00:00:00.000Z" }
    private fun toIso(): String? = _range.value.endMillis?.let { "${isoDay(it)}T23:59:59.999Z" }

    private fun reload() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val res = repo.list(
                    PurchaseFilters(
                        from = fromIso(),
                        to = toIso(),
                        search = _search.value.trim().ifBlank { null },
                        page = 1,
                        pageSize = 100,
                    ),
                )
                _state.value = PurchasesListState(loading = false, items = res.items)
            } catch (e: AppException) {
                _state.value = PurchasesListState(loading = false, error = e.message)
            }
        }
    }

    private fun isoDay(millis: Long): String =
        java.time.Instant.ofEpochMilli(millis).atZone(java.time.ZoneOffset.UTC).toLocalDate().toString()
}
