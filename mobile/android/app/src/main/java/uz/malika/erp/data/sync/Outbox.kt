package uz.malika.erp.data.sync

import kotlinx.serialization.json.JsonElement
import uz.malika.erp.core.newUuidV4
import uz.malika.erp.core.nowIso
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.local.OutboxEntity

/** The only mutation types the server's push handlers accept. */
object OutboxType {
    const val SALE_CREATE = "sale.create"
    const val CONSIGNMENT_CREATE = "consignment.create"
    const val CONSIGNMENT_SETTLE = "consignment.settle"
    const val CONSIGNMENT_RETURN = "consignment.return"
    val allowed = setOf(SALE_CREATE, CONSIGNMENT_CREATE, CONSIGNMENT_SETTLE, CONSIGNMENT_RETURN)
}

/**
 * The feature-facing door to the offline queue. A feature enqueues one of the
 * four [OutboxType]s; the push drain delivers it and reconciles the result.
 * After enqueuing, [trigger] kicks a sync attempt (a no-op until wired).
 */
class OutboxApi(
    private val db: AppDatabase,
    private val trigger: suspend () -> Unit = {},
) {
    /** Queue an offline write. Returns the mutation id (also the client UUID). */
    suspend fun enqueue(type: String, payload: JsonElement, baseVersion: Int? = null): String {
        require(type in OutboxType.allowed) { "Outbox type not allowed offline: $type" }
        val id = newUuidV4()
        db.outboxDao().insert(
            OutboxEntity(
                id = id,
                type = type,
                payload = payload.toString(),
                baseVersion = baseVersion,
                createdAt = nowIso(),
            ),
        )
        trigger()
        return id
    }
}
