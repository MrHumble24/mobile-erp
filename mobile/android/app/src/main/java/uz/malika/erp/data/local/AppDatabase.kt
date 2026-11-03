package uz.malika.erp.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

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
    version = 2,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun deviceDao(): DeviceDao
    abstract fun partnerDao(): PartnerDao
    abstract fun outboxDao(): OutboxDao
    abstract fun syncMetaDao(): SyncMetaDao

    companion object {
        /**
         * Adds the optional second IMEI. A plain ALTER (not destructive migration)
         * so the outbox's queued offline mutations survive the schema bump.
         */
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE devices ADD COLUMN imei2 TEXT")
            }
        }

        fun build(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "malika.db")
                .addMigrations(MIGRATION_1_2)
                .build()
    }
}
