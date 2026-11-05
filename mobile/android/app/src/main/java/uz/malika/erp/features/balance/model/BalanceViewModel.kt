package uz.malika.erp.features.balance.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.balance.data.CreateLedgerTxnBody
import uz.malika.erp.features.balance.data.CreateTransferBody
import uz.malika.erp.features.balance.data.LedgerApi
import uz.malika.erp.features.balance.data.LedgerBalances
import uz.malika.erp.features.balance.data.LedgerFilter
import uz.malika.erp.features.balance.data.LedgerRepository
import uz.malika.erp.features.balance.data.LedgerTxn
import uz.malika.erp.shared.lib.PageState

data class BalanceUiState(
    val balances: LedgerBalances? = null,
    val filter: LedgerFilter = LedgerFilter(),
    val page: PageState<LedgerTxn> = PageState(),
    val error: String? = null,
    val refreshing: Boolean = false,
)

/** One-shot feedback to the screen: [Message] carries an i18n key, [Failure] a human message. */
sealed interface BalanceEvent {
    data class Message(val key: String) : BalanceEvent
    data class Failure(val text: String) : BalanceEvent
}

/**
 * Drives the store-balance screen: the two account balances + total, the
 * paginated history (filtered by account / type / date range) and the manual,
 * online-only writes. A write while offline is refused with `common.offline` —
 * ledger entries are never queued. After any write, balances and history reload.
 */
class BalanceViewModel(private val container: AppContainer) : ViewModel() {

    private val repo = LedgerRepository(container.retrofit.create(LedgerApi::class.java))

    private val _state = MutableStateFlow(BalanceUiState())
    val state: StateFlow<BalanceUiState> = _state.asStateFlow()

    private val _events = MutableSharedFlow<BalanceEvent>(extraBufferCapacity = 4)
    val events = _events.asSharedFlow()

    init { reload() }

    fun setFilter(filter: LedgerFilter) {
        _state.value = _state.value.copy(filter = filter)
        reload()
    }

    fun clearFilters() {
        _state.value = _state.value.copy(filter = LedgerFilter())
        reload()
    }

    fun reload() {
        loadBalances()
        loadPage(1)
    }

    /** Pull-to-refresh: same reload, but the indicator shows until the list settles. */
    fun refresh() {
        _state.value = _state.value.copy(refreshing = true)
        reload()
    }

    fun loadMore() {
        val page = _state.value.page
        if (page.loading || !page.hasMore) return
        loadPage(page.nextPage)
    }

    private fun loadBalances() {
        viewModelScope.launch {
            runCatching { repo.balances() }
                .onSuccess { _state.value = _state.value.copy(balances = it) }
        }
    }

    private fun loadPage(page: Int) {
        _state.value = _state.value.copy(
            page = _state.value.page.copy(loading = true),
            error = if (page <= 1) null else _state.value.error,
        )
        viewModelScope.launch {
            try {
                val result = repo.transactions(_state.value.filter, page)
                _state.value = _state.value.copy(
                    page = _state.value.page.append(result.items, result.total, page),
                    error = null,
                    refreshing = false,
                )
            } catch (e: AppException) {
                _state.value = _state.value.copy(
                    page = _state.value.page.copy(loading = false),
                    error = e.message,
                    refreshing = false,
                )
            }
        }
    }

    fun createEntry(body: CreateLedgerTxnBody, onSuccess: () -> Unit) =
        write("balance.entrySaved", onSuccess, conflictKey = "balance.errorOpeningExists") { repo.create(body) }

    fun transfer(body: CreateTransferBody, onSuccess: () -> Unit) =
        write("balance.transferSaved", onSuccess) { repo.transfer(body) }

    private fun write(
        successKey: String,
        onSuccess: () -> Unit,
        conflictKey: String? = null,
        block: suspend () -> Unit,
    ) {
        if (!container.connectivity.online.value) {
            _events.tryEmit(BalanceEvent.Message("common.offline"))
            return
        }
        viewModelScope.launch {
            try {
                block()
                _events.tryEmit(BalanceEvent.Message(successKey))
                onSuccess()
                reload()
            } catch (e: AppException) {
                val key = conflictKey?.takeIf { e.statusCode == 409 }
                _events.tryEmit(if (key != null) BalanceEvent.Message(key) else BalanceEvent.Failure(e.message))
            }
        }
    }
}
