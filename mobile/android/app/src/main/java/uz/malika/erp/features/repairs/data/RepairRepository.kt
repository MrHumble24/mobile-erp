package uz.malika.erp.features.repairs.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import uz.malika.erp.core.runApi
import uz.malika.erp.shared.lib.DEFAULT_PAGE_SIZE

@Serializable
data class ChangeStatusBody(val toStatusCode: String, val note: String? = null)

@Serializable
data class AddPartBody(val modelId: String, val quantity: Int)

@Serializable
data class RepairMoneyBody(val amount: Double, val accountCode: String)

/** Server filters for the repairs list; empty values are dropped from the query. */
data class RepairFilters(
    val status: String? = null,
    val from: String? = null,
    val to: String? = null,
    val search: String? = null,
    val page: Int = 1,
    val pageSize: Int = DEFAULT_PAGE_SIZE,
) {
    fun toQuery(): Map<String, String> = buildMap {
        status?.takeIf { it.isNotBlank() }?.let { put("status", it) }
        from?.let { put("from", it) }
        to?.let { put("to", it) }
        search?.takeIf { it.isNotBlank() }?.let { put("search", it) }
        put("page", page.toString())
        put("pageSize", pageSize.toString())
    }
}

/** The only place that talks to `/repairs` (ADR 0040). Every call is online. */
class RepairRepository(private val api: RepairApi) {

    suspend fun list(filters: RepairFilters): RepairPage = runApi { api.list(filters.toQuery()) }

    suspend fun get(id: String): RepairView = runApi { api.get(id) }

    suspend fun report(fromIso: String?, toIso: String?): RepairReport = runApi {
        api.report(buildMap { fromIso?.let { put("from", it) }; toIso?.let { put("to", it) } })
    }

    suspend fun create(body: JsonObject): RepairView = runApi { api.create(body) }

    suspend fun update(id: String, body: JsonObject): RepairView = runApi { api.update(id, body) }

    suspend fun changeStatus(id: String, toStatusCode: String, note: String?): RepairView =
        runApi { api.changeStatus(id, ChangeStatusBody(toStatusCode, note?.trim()?.ifBlank { null })) }

    suspend fun addPart(id: String, modelId: String, quantity: Int): RepairView =
        runApi { api.addPart(id, AddPartBody(modelId, quantity)) }

    suspend fun removePart(id: String, partId: String): RepairView = runApi { api.removePart(id, partId) }

    suspend fun addPayment(id: String, amount: Double, accountCode: String): RepairView =
        runApi { api.addPayment(id, RepairMoneyBody(amount, accountCode)) }

    suspend fun refund(id: String, amount: Double, accountCode: String): RepairView =
        runApi { api.refund(id, RepairMoneyBody(amount, accountCode)) }

    suspend fun outsidePayment(id: String, amount: Double, accountCode: String): RepairView =
        runApi { api.outsidePayment(id, RepairMoneyBody(amount, accountCode)) }
}
