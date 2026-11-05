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
        ProductEntity::class,
        PartnerEntity::class,
        OutboxEntity::class,
        SyncMetaEntity::class,
    ],
    version = 5,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun deviceDao(): DeviceDao
    abstract fun productDao(): ProductDao
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

        /**
         * Quantity-product stock cache (ADR 0030): a new `products` table for the
         * offline till. A plain CREATE — existing tables (devices, outbox, …) are
         * untouched, so queued offline mutations and the device cache survive.
         */
        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `products` (`modelId` TEXT NOT NULL, " +
                        "`brand` TEXT NOT NULL, `name` TEXT NOT NULL, `barcode` TEXT, " +
                        "`salePrice` TEXT, `quantity` INTEGER NOT NULL, PRIMARY KEY(`modelId`))",
                )
            }
        }

        /**
         * Picture + category on the cache (ADR 0031): adds `categoryId`/`imageUrl`
         * to `devices` and `products` so the offline till grid can group by
         * category and draw each product's picture. Plain ALTERs — existing rows
         * and the outbox are untouched; the next pull fills the new columns.
         */
        private val MIGRATION_4_5 = object : Migration(4, 5) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE devices ADD COLUMN categoryId TEXT")
                db.execSQL("ALTER TABLE devices ADD COLUMN imageUrl TEXT")
                db.execSQL("ALTER TABLE products ADD COLUMN categoryId TEXT")
                db.execSQL("ALTER TABLE products ADD COLUMN imageUrl TEXT")
            }
        }

        fun build(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "malika.db")
                .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5)
                .build()
    }
}
