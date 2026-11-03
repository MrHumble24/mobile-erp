package uz.malika.erp.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

/** Reactive access to cached [DeviceEntity]. `watch*` emits on every change. */
@Dao
interface DeviceDao {
    @Query("SELECT * FROM devices ORDER BY imei ASC")
    fun watchAll(): Flow<List<DeviceEntity>>

    /** Matches either IMEI so a dual-SIM device resolves from either number. */
    @Query("SELECT * FROM devices WHERE imei = :code OR imei2 = :code LIMIT 1")
    suspend fun findByImei(code: String): DeviceEntity?

    @Upsert
    suspend fun upsertAll(rows: List<DeviceEntity>)

    @Query("DELETE FROM devices")
    suspend fun clear()
}

/** Reactive access to cached [PartnerEntity]. */
@Dao
interface PartnerDao {
    @Query("SELECT * FROM partners ORDER BY shopName ASC")
    fun watchAll(): Flow<List<PartnerEntity>>

    @Upsert
    suspend fun upsertAll(rows: List<PartnerEntity>)

    @Query("DELETE FROM partners")
    suspend fun clear()
}

/**
 * The offline mutation queue. The push drain reads [pending], then marks each
 * entry applied (delete), conflict, or rejected — never silently dropped.
 */
@Dao
interface OutboxDao {
    @Query("SELECT * FROM outbox ORDER BY createdAt ASC")
    fun watchAll(): Flow<List<OutboxEntity>>

    @Query("SELECT * FROM outbox WHERE status = 'pending' ORDER BY createdAt ASC")
    suspend fun pending(): List<OutboxEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: OutboxEntity)

    @Delete
    suspend fun delete(entry: OutboxEntity)

    @Query("DELETE FROM outbox WHERE id = :id")
    suspend fun remove(id: String)

    @Query("UPDATE outbox SET status = :status, lastError = :error WHERE id = :id")
    suspend fun markStatus(id: String, status: String, error: String?)
}

/** Key/value scratchpad for sync bookkeeping (the changes cursor). */
@Dao
interface SyncMetaDao {
    @Query("SELECT value FROM sync_meta WHERE key = :key LIMIT 1")
    suspend fun get(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun set(row: SyncMetaEntity)
}
