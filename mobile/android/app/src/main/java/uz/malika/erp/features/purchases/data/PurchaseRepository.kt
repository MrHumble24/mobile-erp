package uz.malika.erp.features.purchases.data

import kotlinx.serialization.json.JsonObject
import uz.malika.erp.core.runApi
import uz.malika.erp.shared.lib.DEFAULT_PAGE_SIZE

/** Server filters for the purchases list; empty values are dropped from the query. */
data class PurchaseFilters(
    val from: String? = null,
    val to: String? = null,
    val customerId: String? = null,
    val search: String? = null,
    val page: Int = 1,
    val pageSize: Int = DEFAULT_PAGE_SIZE,
) {
    fun toQuery(): Map<String, String> = buildMap {
        from?.let { put("from", it) }
        to?.let { put("to", it) }
        customerId?.takeIf { it.isNotBlank() }?.let { put("customerId", it) }
        search?.takeIf { it.isNotBlank() }?.let { put("search", it) }
        put("page", page.toString())
        put("pageSize", pageSize.toString())
    }
}

/** The only place that talks to `/customer-purchases`. Every call is online (ADR 0039). */
class PurchaseRepository(private val api: PurchaseApi) {

    suspend fun list(filters: PurchaseFilters): CustomerPurchasePageDto = runApi { api.list(filters.toQuery()) }

    suspend fun get(id: String): CustomerPurchaseDto = runApi { api.get(id) }

    suspend fun create(body: JsonObject): CustomerPurchaseDto = runApi { api.create(body) }
}
