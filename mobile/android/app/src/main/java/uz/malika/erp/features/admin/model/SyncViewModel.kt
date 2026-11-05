package uz.malika.erp.features.admin.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import uz.malika.erp.AppContainer
import uz.malika.erp.data.local.OutboxEntity

/** One conflict row distilled from the server's raw `/sync/conflicts` payload. */
data class ConflictRow(val id: String, val code: String, val type: String)

/**
 * Sync status: the live offline outbox (from the local DB), a manual trigger,
 * and — for a `sync.resolve` user — the server conflict inbox. Writes here go
 * through the foundation SyncManager / ConflictStore, never a slice client.
 */
class SyncViewModel(private val container: AppContainer) : ViewModel() {

    val outbox: StateFlow<List<OutboxEntity>> =
        container.db.outboxDao().watchAll()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _conflicts = MutableStateFlow<Async<List<ConflictRow>>>(Async.Loading)
    val conflicts: StateFlow<Async<List<ConflictRow>>> = _conflicts.asStateFlow()

    fun loadConflicts() {
        viewModelScope.launch { _conflicts.value = asyncOf { fetchConflicts() } }
    }

    fun syncNow() {
        container.syncManager.syncNow()
        loadConflicts()
    }

    suspend fun resolve(id: String, resolution: String) {
        container.conflicts.resolve(id, resolution)
        loadConflicts()
    }

    private suspend fun fetchConflicts(): List<ConflictRow> {
        val raw = container.conflicts.list()
        val array = raw as? JsonArray ?: return emptyList()
        return array.map { el ->
            val obj = el.jsonObject
            ConflictRow(
                id = obj["id"]?.jsonPrimitive?.content ?: "",
                code = (obj["imei"] ?: obj["serialNumber"])?.jsonPrimitive?.content ?: "—",
                type = obj["attemptedChange"]?.jsonObject?.get("type")?.jsonPrimitive?.content
                    ?: obj["type"]?.jsonPrimitive?.content ?: "—",
            )
        }
    }
}
