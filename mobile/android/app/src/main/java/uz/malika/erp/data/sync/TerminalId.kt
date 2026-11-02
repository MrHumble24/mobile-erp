package uz.malika.erp.data.sync

import uz.malika.erp.core.SecureStore
import uz.malika.erp.core.newUuidV4

/**
 * This device's stable `terminalId`, sent with every `/sync/push`. Generated
 * once and persisted in secure storage.
 */
class TerminalId(private val secure: SecureStore) {
    fun get(): String {
        secure.get(SecureStore.Keys.TERMINAL_ID)?.takeIf { it.isNotEmpty() }?.let { return it }
        val fresh = newUuidV4()
        secure.put(SecureStore.Keys.TERMINAL_ID, fresh)
        return fresh
    }
}
