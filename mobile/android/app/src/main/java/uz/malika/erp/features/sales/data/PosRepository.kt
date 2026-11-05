package uz.malika.erp.features.sales.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import uz.malika.erp.core.AppException
import uz.malika.erp.core.runApi
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.sync.OutboxApi
import uz.malika.erp.data.sync.OutboxType

/**
 * POS data access: resolve a device by IMEI (local cache first, then the server),
 * enqueue a checkout to the outbox (offline-capable), and expose settings +
 * pending-sold IMEIs. Checkout NEVER posts directly — it always goes through the
 * outbox so a sale survives a dropped connection; the push drain delivers it.
 */
class PosRepository(
    private val api: SalesApi,
    private val db: AppDatabase,
    private val outbox: OutboxApi,
    private val json: Json,
) {
    /** Cached row first (offline), then `/devices/by-imei/:imei`; null when neither has it. */
    suspend fun lookup(imei: String, online: Boolean): ScannedDevice? {
        db.deviceDao().findByImei(imei)?.let { return ScannedDevice.fromCache(it) }
        if (!online) return null
        return runApi {
            try {
                ScannedDevice.fromDto(api.deviceByImei(imei))
            } catch (e: AppException) {
                if (e.statusCode == 404) null else throw e
            }
        }
    }

    /** Unit codes with a pending offline `sale.create` — treated as already sold on re-scan. */
    fun watchPendingSoldImeis(): Flow<Set<String>> =
        db.outboxDao().watchAll().map { rows ->
            rows.asSequence()
                .filter { it.type == OutboxType.SALE_CREATE && it.status == "pending" }
                .mapNotNull { codeOf(it.payload) }
                .toSet()
        }

    /** Whichever identifier the queued sale carries — imei or serialNumber (ADR 0029). */
    private fun codeOf(payloadJson: String): String? =
        runCatching {
            val obj = json.parseToJsonElement(payloadJson).jsonObject
            (obj["imei"] ?: obj["serialNumber"])?.jsonPrimitive?.content
        }.getOrNull()?.takeIf { it.isNotEmpty() }

    /** Queue the checkout. Returns the mutation id (= clientMutationId the server dedups on). */
    suspend fun enqueueSale(payload: kotlinx.serialization.json.JsonObject, baseVersion: Int): String =
        outbox.enqueue(OutboxType.SALE_CREATE, payload, baseVersion)

    suspend fun defaultWarrantyDays(): Int = runApi { api.settings().defaultWarrantyDays }
}
