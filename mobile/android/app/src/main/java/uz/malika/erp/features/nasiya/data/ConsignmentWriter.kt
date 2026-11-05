package uz.malika.erp.features.nasiya.data

import kotlinx.serialization.json.JsonObjectBuilder
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.core.AppException
import uz.malika.erp.core.newUuidV4
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.sync.Connectivity
import uz.malika.erp.data.sync.OutboxApi
import uz.malika.erp.data.sync.OutboxType
import uz.malika.erp.shared.lib.UnitCode

/**
 * The offline-capable consignment lifecycle (ADR 0008). The three
 * server-registered types (`consignment.create|settle|return`) hit REST when
 * online, else the outbox for the push drain; a network failure mid-call also
 * falls back to the outbox so a money-path write is never lost. A non-network
 * error (validation, credit-limit, conflict) is rethrown for the caller to show.
 *
 * `baseVersion` is the consigned device's cached version (optimistic
 * concurrency). The server fills `clientMutationId` from the push mutation id,
 * so the offline payload omits it; the REST body carries a fresh one so a REST
 * retry stays idempotent. [enqueue] returns `true` when queued offline.
 */
class ConsignmentWriter(
    private val api: NasiyaApi,
    private val outbox: OutboxApi,
    private val db: AppDatabase,
    private val connectivity: Connectivity,
) {
    private suspend fun deviceVersion(code: String): Int? =
        db.deviceDao().findByImei(code)?.version

    suspend fun create(
        code: String,
        partnerId: String,
        agreedPrice: Double,
        dueDateIso: String,
        notes: String?,
    ): Boolean {
        val version = deviceVersion(code)
        // Exactly one identifier (ADR 0029): a 15-digit IMEI goes as imei, else serialNumber.
        val id = UnitCode.identify(code)
        return dispatch(
            rest = {
                api.createConsignment(
                    CreateConsignmentBody(
                        imei = id.imei,
                        serialNumber = id.serialNumber,
                        partnerId = partnerId,
                        agreedPrice = agreedPrice,
                        dueDate = dueDateIso,
                        notes = notes,
                        clientMutationId = newUuidV4(),
                    ),
                )
            },
            type = OutboxType.CONSIGNMENT_CREATE,
            baseVersion = version,
        ) {
            id.imei?.let { put("imei", it) }
            id.serialNumber?.let { put("serialNumber", it) }
            put("partnerId", partnerId)
            put("agreedPrice", agreedPrice)
            put("dueDate", dueDateIso)
            notes?.let { put("notes", it) }
        }
    }

    suspend fun settle(
        consignmentId: String,
        code: String,
        salePrice: Double?,
        notes: String?,
    ): Boolean = dispatch(
        rest = { api.settle(consignmentId, SettleBody(salePrice, notes)) },
        type = OutboxType.CONSIGNMENT_SETTLE,
        baseVersion = deviceVersion(code),
    ) {
        put("consignmentId", consignmentId)
        salePrice?.let { put("salePrice", it) }
        notes?.let { put("notes", it) }
    }

    suspend fun returnToStock(
        consignmentId: String,
        code: String,
        reason: String?,
        condition: String?,
    ): Boolean = dispatch(
        rest = { api.returnToStock(consignmentId, ReturnBody(reason, condition)) },
        type = OutboxType.CONSIGNMENT_RETURN,
        baseVersion = deviceVersion(code),
    ) {
        put("consignmentId", consignmentId)
        reason?.let { put("reason", it) }
        condition?.let { put("condition", it) }
    }

    private suspend fun dispatch(
        rest: suspend () -> Unit,
        type: String,
        baseVersion: Int?,
        payload: JsonObjectBuilder.() -> Unit,
    ): Boolean {
        if (connectivity.online.value) {
            try {
                rest()
                return false
            } catch (e: AppException) {
                if (!e.isNetwork) throw e // validation / credit-limit / conflict
            }
        }
        outbox.enqueue(type, buildJsonObject(payload), baseVersion)
        return true
    }
}
