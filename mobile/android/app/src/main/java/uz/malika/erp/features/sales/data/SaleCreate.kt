package uz.malika.erp.features.sales.data

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.math.BigDecimal

/**
 * Pure builder for a `sale.create` outbox payload. Kept free of HTTP/Android so
 * it is unit-testable and identical online and offline. `clientMutationId` and
 * `expectedVersion` are NOT included here — the server's push handler fills them
 * from the mutation envelope (outbox id → clientMutationId, baseVersion →
 * expectedVersion), per ADR 0007/0011. Absent optionals are omitted so the
 * server's `forbidNonWhitelisted` stays happy. A picked [customerId] and an
 * inline new customer are mutually exclusive (id wins).
 */
object SaleCreate {
    fun payload(
        imei: String,
        salePrice: BigDecimal,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        warrantyDays: Int? = null,
        notes: String? = null,
    ): JsonObject = buildJsonObject {
        put("imei", imei)
        put("salePrice", JsonPrimitive(salePrice))
        when {
            !customerId.isNullOrBlank() -> put("customerId", customerId)
            !customerName.isNullOrBlank() -> put(
                "customer",
                buildJsonObject {
                    put("name", customerName.trim())
                    customerPhone?.trim()?.takeIf { it.isNotEmpty() }?.let { put("phone", it) }
                },
            )
        }
        warrantyDays?.let { put("warrantyDays", it) }
        notes?.trim()?.takeIf { it.isNotEmpty() }?.let { put("notes", it) }
    }

    /** IMEI is exactly 15 digits (mirrors the server `CreateSaleDto` rule). */
    fun isValidImei(imei: String): Boolean = imei.matches(Regex("\\d{15}"))
}
