package uz.malika.erp.core

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.local.SyncMetaKeys
import uz.malika.erp.data.sync.PullService

/**
 * Handles active store switching (Item 4).
 * Order of operations:
 * 1. save the new store;
 * 2. clear every list the app keeps in memory;
 * 3. delete the offline copies of devices and products;
 * 4. reset the sync position;
 * 5. pull again.
 * The offline queue is NOT cleared.
 */
class StoreSwitcher(
    private val storeManager: StoreManager,
    private val db: AppDatabase,
    private val pull: PullService,
    private val scope: CoroutineScope,
) {
    fun switchStore(newStoreId: String, onDone: () -> Unit = {}) {
        scope.launch(Dispatchers.IO) {
            // 1. save the new store
            storeManager.setActiveStoreId(newStoreId)
            // 2. clear in-memory lists (the shell recomposes and drops cached ViewModel state)
            // 3. delete the offline copies of devices and products
            db.deviceDao().clear()
            db.productDao().clear()
            // 4. reset the sync position
            db.syncMetaDao().delete(SyncMetaKeys.CURSOR)
            // 5. pull again
            runCatching { pull.pull() }
            onDone()
        }
    }
}
