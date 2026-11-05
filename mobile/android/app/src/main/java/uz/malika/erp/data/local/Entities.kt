package uz.malika.erp.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Cached devices from `/sync/changes`. Cost fields are intentionally absent —
 * the server redacts them for under-privileged users, so they are never cached.
 * `specs` and `latestSale` are stored as JSON text and decoded on read.
 */
@Entity(tableName = "devices")
data class DeviceEntity(
    @PrimaryKey val id: String,
    val imei: String? = null, // null for a serial unit (ADR 0029)
    val imei2: String? = null, // optional second IMEI (dual-SIM); matched by findByImei
    val serialNumber: String? = null, // null for an IMEI unit; exactly one of imei/serialNumber is set
    val kindCode: String? = null, // the model's product kind (IMEI | SERIAL | QUANTITY)
    val statusCode: String,
    val version: Int,
    val targetPrice: String?, // Decimal string
    val specs: String = "{}",
    val modelId: String,
    val modelBrand: String,
    val modelName: String,
    val latestSale: String?, // JSON
    val gradeCode: String?,
    val inspectionNotes: String?,
    val updatedAt: String,
)

/** Cached partners from `/sync/changes`. Money columns are Decimal strings. */
@Entity(tableName = "partners")
data class PartnerEntity(
    @PrimaryKey val id: String,
    val shopName: String,
    val phone: String?,
    val creditLimit: String,
    val outstanding: String,
)

/**
 * Queued offline mutations awaiting `/sync/push`. Only the 4 server-registered
 * types are ever written here (`sale.create`, `consignment.create/settle/return`).
 * `status`: pending | conflict | rejected. `createdAt` (ISO) is sent as the
 * mutation's `occurredAt` and is the drain order.
 */
@Entity(tableName = "outbox")
data class OutboxEntity(
    @PrimaryKey val id: String, // client UUID, also the push mutation id
    val type: String,
    val payload: String, // JSON
    val baseVersion: Int?,
    val createdAt: String, // ISO-8601
    val status: String = "pending",
    val lastError: String? = null,
)

/** Single-row-per-key scratchpad for sync bookkeeping (the changes cursor). */
@Entity(tableName = "sync_meta")
data class SyncMetaEntity(
    @PrimaryKey val key: String,
    val value: String,
)

object SyncMetaKeys {
    const val CURSOR = "changes_cursor"
}
