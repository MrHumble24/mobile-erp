package uz.malika.erp.features.nasiya.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.nasiya.data.NasiyaModule

/** One device line of the consign form; [code] is an IMEI or a serial number. */
data class ConsignEntry(val code: String, val agreedPrice: Double)

/**
 * The three offline-capable consignment writes (ADR 0008): consign one-or-many
 * devices, settle, return. The writer decides REST-now vs outbox, so these do
 * NOT block when offline — [ActionState.queuedOffline] tells the sheet to show a
 * pending-sync note. Consigning loops per row and stops at the first hard error.
 */
class ConsignWriteViewModel(container: AppContainer) : ViewModel() {

    private val writer = NasiyaModule.consignmentWriter(container)
    private val sync = container.syncManager
    private val _state = MutableStateFlow(ActionState())
    val state = _state.asStateFlow()

    fun consign(partnerId: String, dueDateIso: String, notes: String?, rows: List<ConsignEntry>) {
        launchWrite {
            var queued = false
            for (row in rows) {
                if (writer.create(row.code, partnerId, row.agreedPrice, dueDateIso, notes)) queued = true
            }
            queued
        }
    }

    fun settle(consignmentId: String, code: String, salePrice: Double?, notes: String?) =
        launchWrite { writer.settle(consignmentId, code, salePrice, notes) }

    fun returnToStock(consignmentId: String, code: String, reason: String?, condition: String?) =
        launchWrite { writer.returnToStock(consignmentId, code, reason, condition) }

    /** Runs an offline-capable write, mapping its queued/applied/error outcome. */
    private fun launchWrite(block: suspend () -> Boolean) {
        if (_state.value.submitting) return
        _state.value = ActionState(submitting = true)
        viewModelScope.launch {
            try {
                val queued = block()
                sync.syncNow()
                _state.value = ActionState(done = true, queuedOffline = queued)
            } catch (e: AppException) {
                _state.value = ActionState(error = e.message, offline = e.isNetwork)
            }
        }
    }
}
