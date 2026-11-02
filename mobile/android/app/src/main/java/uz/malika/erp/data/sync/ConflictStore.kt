package uz.malika.erp.data.sync

import kotlinx.serialization.json.JsonElement
import uz.malika.erp.core.runApi
import uz.malika.erp.data.remote.ApiService
import uz.malika.erp.data.remote.ResolveConflictRequest

/**
 * Server-side sync conflicts (permission `sync.resolve`). Wave 1 builds the
 * inbox UI on top of this; wave 0 ships the fetch + resolve calls.
 */
class ConflictStore(private val api: ApiService) {

    /** Raw conflict rows from `GET /sync/conflicts` (shape owned by the server). */
    suspend fun list(): JsonElement = runApi { api.conflicts() }

    /** `POST /sync/conflicts/:id/resolve` with `keep-server` or `apply-terminal`. */
    suspend fun resolve(id: String, resolution: String, note: String? = null) = runApi {
        api.resolveConflict(id, ResolveConflictRequest(resolution, note))
    }
}
