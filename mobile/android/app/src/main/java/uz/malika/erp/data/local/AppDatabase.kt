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
    version = 3,
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

        /**
         * Product kinds + serial units (ADR 0029): adds `serialNumber`/`kindCode`
         * and makes `imei` nullable. SQLite cannot drop NOT NULL in place, so the
         * devices cache is rebuilt — it re-hydrates from `/sync/changes`, while the
         * outbox and other tables are untouched, so queued offline mutations survive.
         */
        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE `devices_new` (`id` TEXT NOT NULL, `imei` TEXT, `imei2` TEXT, " +
                        "`serialNumber` TEXT, `kindCode` TEXT, `statusCode` TEXT NOT NULL, " +
                        "`version` INTEGER NOT NULL, `targetPrice` TEXT, `specs` TEXT NOT NULL, " +
                        "`modelId` TEXT NOT NULL, `modelBrand` TEXT NOT NULL, `modelName` TEXT NOT NULL, " +
                        "`latestSale` TEXT, `gradeCode` TEXT, `inspectionNotes` TEXT, " +
                        "`updatedAt` TEXT NOT NULL, PRIMARY KEY(`id`))",
                )
                db.execSQL(
                    "INSERT INTO `devices_new` (id, imei, imei2, statusCode, version, targetPrice, " +
                        "specs, modelId, modelBrand, modelName, latestSale, gradeCode, inspectionNotes, " +
                        "updatedAt) SELECT id, imei, imei2, statusCode, version, targetPrice, specs, " +
                        "modelId, modelBrand, modelName, latestSale, gradeCode, inspectionNotes, " +
                        "updatedAt FROM `devices`",
                )
                db.execSQL("DROP TABLE `devices`")
                db.execSQL("ALTER TABLE `devices_new` RENAME TO `devices`")
            }
        }

        fun build(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "malika.db")
                .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                .build()
    }
}
