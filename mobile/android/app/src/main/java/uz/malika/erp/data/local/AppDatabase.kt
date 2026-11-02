package uz.malika.erp.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

/**
 * The single Room database. Feature repositories read these cached tables with
 * their own reactive queries; they never open a second database. New tables are
 * added here by the integrator only (see FOUNDATION.md), never inside a feature.
 */
@Database(
    entities = [
        DeviceEntity::class,
        PartnerEntity::class,
        OutboxEntity::class,
        SyncMetaEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun deviceDao(): DeviceDao
    abstract fun partnerDao(): PartnerDao
    abstract fun outboxDao(): OutboxDao
    abstract fun syncMetaDao(): SyncMetaDao

    companion object {
        fun build(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "malika.db").build()
    }
}
