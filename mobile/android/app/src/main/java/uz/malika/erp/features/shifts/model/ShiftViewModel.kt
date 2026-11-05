package uz.malika.erp.features.shifts.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.shifts.data.ShiftReportView
import uz.malika.erp.features.shifts.data.ShiftRepository

data class ShiftBarState(
    val loading: Boolean = false,
    val current: ShiftReportView? = null,
    val lastKnownOpen: Boolean? = null,
    val submitting: Boolean = false,
    val error: String? = null,
    /** A just-closed shift, to show its report. */
    val closedReport: ShiftReportView? = null,
)

/**
 * The till's shift state (ADR 0036): the current open shift (live figures) for
 * the bar, plus open/close. Also the selling gate: when shifts are on, selling is
 * blocked online without an open shift, and offline it follows the last-known
 * state. Opening/closing are online only.
 */
class ShiftViewModel(private val repo: ShiftRepository) : ViewModel() {

    private val _state = MutableStateFlow(ShiftBarState())
    val state = _state.asStateFlow()

    /** Refresh the current shift. Online: ask the server; offline: last-known only. */
    fun load(online: Boolean) {
        _state.value = _state.value.copy(loading = true, error = null, lastKnownOpen = repo.lastKnownOpen())
        viewModelScope.launch {
            val current = if (online) runCatching { repo.current() }.getOrNull() else null
            _state.value = _state.value.copy(loading = false, current = current, lastKnownOpen = repo.lastKnownOpen())
        }
    }

    /** Can a sale proceed? Off → always; online → needs an open shift; offline → last-known. */
    fun canSell(shiftsEnabled: Boolean, online: Boolean): Boolean {
        if (!shiftsEnabled) return true
        return if (online) _state.value.current != null else (_state.value.lastKnownOpen ?: false)
    }

    fun openShift(openingCount: Double, onDone: () -> Unit) {
        if (_state.value.submitting) return
        _state.value = _state.value.copy(submitting = true, error = null)
        viewModelScope.launch {
            try {
                val shift = repo.open(openingCount)
                _state.value = _state.value.copy(submitting = false, current = shift, lastKnownOpen = true)
                onDone()
            } catch (e: AppException) {
                _state.value = _state.value.copy(submitting = false, error = e.message)
            }
        }
    }

    fun closeShift(closingCount: Double, note: String?, onDone: () -> Unit) {
        if (_state.value.submitting) return
        _state.value = _state.value.copy(submitting = true, error = null)
        viewModelScope.launch {
            try {
                val report = repo.close(closingCount, note)
                _state.value = _state.value.copy(submitting = false, current = null, lastKnownOpen = false, closedReport = report)
                onDone()
            } catch (e: AppException) {
                _state.value = _state.value.copy(submitting = false, error = e.message)
            }
        }
    }

    fun clearError() { _state.value = _state.value.copy(error = null) }
    fun dismissClosedReport() { _state.value = _state.value.copy(closedReport = null) }
}
