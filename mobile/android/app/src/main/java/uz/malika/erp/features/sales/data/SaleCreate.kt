package uz.malika.erp.features.sales.data

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.AccountAmount
import java.math.BigDecimal

/** One `sale.create` ready for the outbox: its payload and the device baseVersion. */
data class SaleOp(val payload: JsonObject, val baseVersion: Int)

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
        payments: List<AccountAmount> = emptyList(),
    ): JsonObject = buildJsonObject {
        put("imei", imei)
        put("salePrice", JsonPrimitive(salePrice))
        // Tender lines for this sale; omitted means the server posts one CASH line.
        if (payments.isNotEmpty()) {
            put(
                "payments",
                buildJsonArray {
                    payments.forEach { line ->
                        add(
                            buildJsonObject {
                                put("accountCode", line.accountCode)
                                put("amount", JsonPrimitive(line.amount))
                            },
                        )
                    }
                },
            )
        }
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

    /**
     * Fan a multi-device cart out into one [SaleOp] per line: the shared customer
     * and notes ride every op; price/warranty come from the line; the baseVersion
     * is that device's version (its own optimistic-lock token). Pure — unit-tested.
     */
    fun ops(
        lines: List<CartLine>,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        notes: String? = null,
        payments: List<List<AccountAmount>> = emptyList(),
    ): List<SaleOp> = lines.mapIndexed { i, line ->
        SaleOp(
            payload = payload(
                imei = line.device.imei,
                salePrice = parseMoney(line.salePrice),
                customerId = customerId,
                customerName = customerName,
                customerPhone = customerPhone,
                warrantyDays = line.warrantyDays.trim().toIntOrNull(),
                notes = notes,
                payments = payments.getOrElse(i) { emptyList() },
            ),
            baseVersion = line.device.version,
        )
    }

    /** IMEI is exactly 15 digits (mirrors the server `CreateSaleDto` rule). */
    fun isValidImei(imei: String): Boolean = imei.matches(Regex("\\d{15}"))
}
