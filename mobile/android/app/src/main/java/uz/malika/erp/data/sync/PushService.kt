package uz.malika.erp.data.sync

import kotlinx.serialization.json.Json
import uz.malika.erp.core.runApi
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.remote.ApiService
import uz.malika.erp.data.remote.PushMutation
import uz.malika.erp.data.remote.PushRequest
import uz.malika.erp.data.remote.PushResult

/**
 * Drains the outbox through `POST /sync/push`, in createdAt order (the server
 * applies them in order), reconciling each result:
 *  - applied | duplicate → delete the entry (a later pull refreshes records),
 *  - conflict            → mark `conflict` (surfaced in the conflict inbox),
 *  - rejected/unexpected → mark `rejected`, keep it, flag the error.
 * Nothing is ever silently dropped.
 */
class PushService(
    private val api: ApiService,
    private val db: AppDatabase,
    private val terminalId: TerminalId,
    private val json: Json,
) {
    suspend fun drain() = runApi {
        val pending = db.outboxDao().pending()
        if (pending.isEmpty()) return@runApi
        val response = api.push(
            PushRequest(
                terminalId = terminalId.get(),
                mutations = pending.map {
                    PushMutation(
                        id = it.id,
                        type = it.type,
                        payload = json.parseToJsonElement(it.payload),
                        baseVersion = it.baseVersion,
                        occurredAt = it.createdAt,
                    )
                },
            ),
        )
        response.results.forEach { apply(it) }
    }

    private suspend fun apply(r: PushResult) {
        when (r.status) {
            "applied", "duplicate" -> db.outboxDao().remove(r.id)
            "conflict" -> db.outboxDao().markStatus(r.id, "conflict", r.conflictId)
            else -> db.outboxDao().markStatus(r.id, "rejected", r.error ?: "rejected")
        }
    }
}
