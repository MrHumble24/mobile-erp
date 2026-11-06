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
    @Query("SELECT * FROM devices ORDER BY COALESCE(imei, serialNumber) ASC")
    fun watchAll(): Flow<List<DeviceEntity>>

    /** Matches either IMEI or the serial number so any scanned code resolves (ADR 0029). */
    @Query("SELECT * FROM devices WHERE imei = :code OR imei2 = :code OR serialNumber = :code LIMIT 1")
    suspend fun findByImei(code: String): DeviceEntity?

    @Upsert
    suspend fun upsertAll(rows: List<DeviceEntity>)

    @Query("DELETE FROM devices")
    suspend fun clear()
}

/** Reactive access to cached [ProductEntity] (quantity products for the offline till). */
@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY name ASC")
    fun watchAll(): Flow<List<ProductEntity>>

    /** Resolve a scanned barcode offline (ADR 0030). */
    @Query("SELECT * FROM products WHERE barcode = :barcode LIMIT 1")
    suspend fun findByBarcode(barcode: String): ProductEntity?

    /** Offline name/barcode search for the till (contains, case-insensitive). */
    @Query(
        "SELECT * FROM products WHERE name LIKE '%' || :q || '%' COLLATE NOCASE " +
            "OR barcode LIKE '%' || :q || '%' ORDER BY name ASC LIMIT 20",
    )
    suspend fun search(q: String): List<ProductEntity>

    @Upsert
    suspend fun upsertAll(rows: List<ProductEntity>)

    @Query("DELETE FROM products")
    suspend fun clear()
}

/** Reactive access to cached [CategoryEntity] (product-category chips for the offline till). */
@Dao
interface CategoryDao {
    @Query("SELECT * FROM categories ORDER BY name ASC")
    fun watchAll(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories")
    suspend fun all(): List<CategoryEntity>

    @Upsert
    suspend fun upsertAll(rows: List<CategoryEntity>)

    @Query("DELETE FROM categories")
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

    @Query("DELETE FROM sync_meta WHERE key = :key")
    suspend fun delete(key: String)
}
