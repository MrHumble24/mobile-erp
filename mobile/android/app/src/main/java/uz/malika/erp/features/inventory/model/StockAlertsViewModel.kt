package uz.malika.erp.features.inventory.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.LowStockView
import uz.malika.erp.features.inventory.data.StockAlertRepository
import uz.malika.erp.features.inventory.data.StockAlertRuleView

/** Low-stock list + alert rules (online). Low-stock count also feeds the metrics bar. */
class StockAlertsViewModel(private val repo: StockAlertRepository) : ViewModel() {

    private val _rules = MutableStateFlow<Async<List<StockAlertRuleView>>>(Async.Loading)
    val rules: StateFlow<Async<List<StockAlertRuleView>>> = _rules.asStateFlow()

    private val _lowStock = MutableStateFlow<List<LowStockView>>(emptyList())
    val lowStock: StateFlow<List<LowStockView>> = _lowStock.asStateFlow()

    init { refresh() }

    fun refresh() {
        _rules.value = Async.Loading
        viewModelScope.launch {
            _rules.value = try {
                Async.Data(repo.list())
            } catch (e: AppException) {
                Async.Error(e.message)
            }
        }
        viewModelScope.launch {
            runCatching { repo.lowStock() }.onSuccess { _lowStock.value = it }
        }
    }

    suspend fun create(modelId: String, storage: String, threshold: Int) {
        repo.create(modelId, storage, threshold)
        refresh()
    }

    suspend fun update(id: String, storage: String, threshold: Int) {
        repo.update(id, storage, threshold)
        refresh()
    }
}
