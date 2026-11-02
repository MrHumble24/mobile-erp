package uz.malika.erp.data.sync

import androidx.room.withTransaction
import uz.malika.erp.core.runApi
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.local.SyncMetaEntity
import uz.malika.erp.data.local.SyncMetaKeys
import uz.malika.erp.data.remote.ApiService

/**
 * Drains `GET /sync/changes` into Room. Pages from the stored cursor until
 * `nextSince` is null, upserting devices + partners and saving the cursor after
 * each page (so a crash mid-pull resumes, not restarts).
 */
class PullService(
    private val api: ApiService,
    private val db: AppDatabase,
) {
    suspend fun pull() = runApi {
        var since = db.syncMetaDao().get(SyncMetaKeys.CURSOR)
        // Guard against a server that never advances the cursor.
        repeat(1000) {
            val page = api.changes(since)
            db.withTransaction {
                if (page.devices.isNotEmpty()) {
                    db.deviceDao().upsertAll(page.devices.map(ChangesMapper::device))
                }
                if (page.partners.isNotEmpty()) {
                    db.partnerDao().upsertAll(page.partners.map(ChangesMapper::partner))
                }
                page.nextSince?.let { db.syncMetaDao().set(SyncMetaEntity(SyncMetaKeys.CURSOR, it)) }
            }
            val next = page.nextSince ?: return@runApi
            since = next
        }
    }
}
