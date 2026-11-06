package uz.malika.erp.features.orders.data

import uz.malika.erp.core.runApi

/** Filters for listing orders; status null means all statuses. */
data class OrderListFilters(
    val status: String? = null,
    val page: Int = 1,
    val pageSize: Int = 20,
) {
    fun toQuery(): Map<String, String> = buildMap {
        status?.takeIf { it.isNotBlank() }?.let { put("status", it) }
        put("page", page.toString())
        put("pageSize", pageSize.toString())
    }
}

/** Repository for storefront orders (ADR 0049, 0050). Online only. */
class OrdersRepository(private val api: OrdersApi) {

    suspend fun list(filters: OrderListFilters): OrderListResponse = runApi {
        api.list(filters.toQuery())
    }

    suspend fun stats(): StorefrontOrderStats = runApi {
        api.stats()
    }

    suspend fun get(id: String): StorefrontOrderDetail = runApi {
        api.get(id)
    }

    suspend fun updateStatus(id: String, statusCode: String, saleId: String? = null): StorefrontOrderDetail = runApi {
        api.updateStatus(id, UpdateOrderStatusDto(statusCode = statusCode, saleId = saleId))
    }
}
