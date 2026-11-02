package uz.malika.erp.features.nasiya.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.nasiya.data.CreatePartnerBody
import uz.malika.erp.features.nasiya.data.NasiyaModule
import uz.malika.erp.features.nasiya.data.PartnerDetailDto
import uz.malika.erp.features.nasiya.data.RecordPaymentBody
import uz.malika.erp.features.nasiya.data.UpdatePartnerBody

/**
 * Partner create / update / record-payment — all online-only (no outbox
 * handler), so each blocks with an offline marker when disconnected and kicks a
 * sync on success so the mirror balances refresh. One VM per open sheet.
 */
class PartnerWriteViewModel(private val container: AppContainer) : ViewModel() {

    private val repo = NasiyaModule.partnerRepository(container)
    private val _state = MutableStateFlow(ActionState())
    val state = _state.asStateFlow()

    /** Full current values for the edit sheet; null until loaded / on failure. */
    private val _detail = MutableStateFlow<PartnerDetailDto?>(null)
    val detail = _detail.asStateFlow()

    fun loadDetail(id: String) {
        if (_detail.value?.id == id) return
        viewModelScope.launch {
            _detail.value = runCatching { repo.get(id) }.getOrNull()
        }
    }

    fun create(body: CreatePartnerBody) = submit { repo.create(body) }

    fun update(id: String, body: UpdatePartnerBody) = submit { repo.update(id, body) }

    fun recordPayment(partnerId: String, body: RecordPaymentBody) =
        submit { repo.recordPayment(partnerId, body) }

    private fun submit(block: suspend () -> Unit) {
        if (_state.value.submitting) return
        if (!container.connectivity.online.value) {
            _state.value = ActionState(offline = true)
            return
        }
        _state.value = ActionState(submitting = true)
        viewModelScope.launch {
            try {
                block()
                container.syncManager.syncNow()
                _state.value = ActionState(done = true)
            } catch (e: AppException) {
                _state.value = ActionState(error = e.message, offline = e.isNetwork)
            }
        }
    }
}
