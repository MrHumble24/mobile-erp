package uz.malika.erp.features.orders.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class OrderListResponse(
    val items: List<StorefrontOrderListItem> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20,
)

@Serializable
data class StorefrontOrderStats(
    val new: Int = 0,
)

@Serializable
data class StorefrontOrderListItem(
    val id: String = "",
    val storeId: String = "",
    val storeName: String = "",
    val modelId: String = "",
    val brand: String = "",
    val productName: String = "",
    val modelName: String = "",
    val specs: JsonObject? = null,
    val customerName: String = "",
    val customerPhone: String = "",
    val note: String? = null,
    val statusCode: String = "",
    val statusLabel: String = "",
    val handledAt: String? = null,
    val handledByName: String? = null,
    val saleId: String? = null,
    val createdAt: String = "",
    val updatedAt: String = "",
)

@Serializable
data class StorefrontOrderStatusHistoryView(
    val id: String = "",
    val fromStatusCode: String? = null,
    val toStatusCode: String = "",
    val toStatusLabel: String = "",
    val changedAt: String = "",
    val changedByName: String? = null,
    val note: String? = null,
)

@Serializable
data class StorefrontOrderDetail(
    val id: String = "",
    val storeId: String = "",
    val storeName: String = "",
    val modelId: String = "",
    val brand: String = "",
    val productName: String = "",
    val modelName: String = "",
    val specs: JsonObject? = null,
    val customerName: String = "",
    val customerPhone: String = "",
    val note: String? = null,
    val statusCode: String = "",
    val statusLabel: String = "",
    val handledAt: String? = null,
    val handledByName: String? = null,
    val saleId: String? = null,
    val createdAt: String = "",
    val updatedAt: String = "",
    val history: List<StorefrontOrderStatusHistoryView> = emptyList(),
)

@Serializable
data class UpdateOrderStatusDto(
    val statusCode: String,
    val saleId: String? = null,
)
