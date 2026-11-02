package uz.malika.erp.data.sync

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import uz.malika.erp.core.SecureStore

/**
 * Orchestrates offline sync: push the outbox first (so local writes land), then
 * pull fresh changes. Runs automatically whenever connectivity flips to online
 * (and once at startup when already online, via the Eagerly-started flow), and
 * on demand via [syncNow] (called after login and after an outbox enqueue).
 *
 * Feature agents never edit this — they enqueue to the outbox and read the cache.
 * A simple coroutine trigger is used, not WorkManager: there is no periodic
 * timer, only connectivity-regain / startup / login / enqueue.
 */
class SyncManager(
    private val scope: CoroutineScope,
    connectivity: Connectivity,
    private val push: PushService,
    private val pull: PullService,
    private val secure: SecureStore,
) {
    private val lock = Mutex()

    init {
        scope.launch {
            connectivity.online.collect { online -> if (online) syncNow() }
        }
    }

    /** Fire-and-forget sync; overlapping triggers are dropped (single-flight). */
    fun syncNow() {
        scope.launch {
            val token = secure.get(SecureStore.Keys.TOKEN)
            if (token.isNullOrEmpty()) return@launch // not authenticated → skip
            if (lock.isLocked) return@launch
            lock.withLock {
                runCatching {
                    push.drain()
                    pull.pull()
                }
                // Offline/transient failures are expected; the next trigger retries.
            }
        }
    }
}
