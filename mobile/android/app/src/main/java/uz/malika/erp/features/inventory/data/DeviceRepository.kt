package uz.malika.erp.features.inventory.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.core.runApi
import uz.malika.erp.data.local.DeviceDao

/**
 * Devices data access. The list is the offline Room mirror (hydrated by
 * `/sync/changes`); detail, history and writes are online-only via [InventoryApi].
 */
class DeviceRepository(private val api: InventoryApi, private val dao: DeviceDao) {

    fun watchDevices(): Flow<List<DeviceListItem>> =
        dao.watchAll().map { rows -> rows.map(DeviceListItem::fromEntity) }

    suspend fun detailByImei(imei: String): DeviceDetail =
        runApi { DeviceDetail.fromDto(api.deviceByImei(imei)) }

    suspend fun history(id: String): List<DeviceHistoryEntry> =
        runApi { api.deviceHistory(id).map(DeviceHistoryEntry::fromDto) }

    /** Replaces specs, target price and second IMEI. Null price/imei2 clear them (sent explicitly). */
    suspend fun update(id: String, specs: Map<String, Any>, targetPrice: Double?, imei2: String?) = runApi {
        val body: JsonObject = buildJsonObject {
            put("specs", buildJsonObject {
                specs.forEach { (k, v) ->
                    when (v) {
                        is Number -> put(k, JsonPrimitive(v))
                        else -> put(k, JsonPrimitive(v.toString()))
                    }
                }
            })
            put("targetPrice", targetPrice?.let { JsonPrimitive(it) } ?: JsonNull)
            put("imei2", imei2?.let { JsonPrimitive(it) } ?: JsonNull)
        }
        api.updateDevice(id, body)
    }

    /** Throws [uz.malika.erp.core.AppException] with statusCode 409 on a version mismatch. */
    suspend fun changeStatus(id: String, toStatusCode: String, expectedVersion: Int, reason: String?) =
        runApi {
            api.changeStatus(
                id,
                ChangeStatusBody(
                    toStatusCode = toStatusCode,
                    expectedVersion = expectedVersion,
                    reason = reason?.trim()?.ifEmpty { null },
                ),
            )
        }
}
