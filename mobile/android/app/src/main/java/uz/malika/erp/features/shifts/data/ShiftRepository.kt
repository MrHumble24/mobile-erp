package uz.malika.erp.features.shifts.data

import uz.malika.erp.core.SecureStore
import uz.malika.erp.core.runApi

/**
 * The only door to `/shifts` (ADR 0036). Caches the last-known open state so the
 * till can keep selling offline when a shift was open at last sight, and must
 * block when it was not. All reads/writes are online; the cache is the one thing
 * that survives a dropped connection.
 */
class ShiftRepository(private val api: ShiftApi, private val secure: SecureStore) {

    /** My open shift (live figures), or null. Caches the open flag for the offline gate. */
    suspend fun current(): ShiftReportView? = runApi {
        val shift = runCatching { api.current() }.getOrNull()
        secure.put(KEY_LAST_OPEN, if (shift != null) "1" else "0")
        shift
    }

    /** The last-known open state, for the offline gate. Null = never seen. */
    fun lastKnownOpen(): Boolean? = when (secure.get(KEY_LAST_OPEN)) {
        "1" -> true
        "0" -> false
        else -> null
    }

    suspend fun open(openingCount: Double): ShiftReportView = runApi {
        api.open(OpenShiftBody(openingCount)).also { secure.put(KEY_LAST_OPEN, "1") }
    }

    suspend fun close(closingCount: Double, note: String?): ShiftReportView = runApi {
        api.close(CloseShiftBody(closingCount, note?.trim()?.ifBlank { null })).also { secure.put(KEY_LAST_OPEN, "0") }
    }

    suspend fun list(
        cashierId: String?,
        fromIso: String?,
        toIso: String?,
        page: Int,
        pageSize: Int,
    ): ShiftListResult = runApi {
        val query = buildMap {
            cashierId?.takeIf { it.isNotBlank() }?.let { put("cashierId", it) }
            fromIso?.let { put("from", it) }
            toIso?.let { put("to", it) }
            put("page", page.toString())
            put("pageSize", pageSize.toString())
        }
        api.list(query)
    }

    suspend fun report(id: String): ShiftReportView = runApi { api.report(id) }

    suspend fun forceClose(id: String, closingCount: Double, note: String): ShiftReportView =
        runApi { api.forceClose(id, ForceCloseShiftBody(closingCount, note)) }

    private companion object {
        const val KEY_LAST_OPEN = "shift_last_open"
    }
}
