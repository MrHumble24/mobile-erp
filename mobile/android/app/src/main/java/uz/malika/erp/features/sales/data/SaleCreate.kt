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

/**
 * One `sale.create` ready for the outbox: its payload and the optimistic-lock
 * token. [baseVersion] is a unit's device version, or null for a quantity sale
 * (no device, no lock — it never conflicts, ADR 0030).
 */
data class SaleOp(val payload: JsonObject, val baseVersion: Int?)

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
        imei: String?,
        serialNumber: String? = null,
        salePrice: BigDecimal,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        warrantyDays: Int? = null,
        notes: String? = null,
        payments: List<AccountAmount> = emptyList(),
    ): JsonObject = buildJsonObject {
        // Exactly one identifier (ADR 0029): the server resolves it against imei,
        // imei2 or serialNumber. A phone sends `imei`, a serial unit `serialNumber`.
        if (imei != null) put("imei", imei) else serialNumber?.let { put("serialNumber", it) }
        put("salePrice", JsonPrimitive(salePrice))
        appendShared(customerId, customerName, customerPhone, notes, payments)
        warrantyDays?.let { put("warrantyDays", it) }
    }

    /**
     * A quantity-product sale (ADR 0030): `modelId` + `quantity` instead of an
     * identifier, `salePrice` as the LINE TOTAL for all pieces, and no warranty.
     * Customer / notes / payments are shared with [payload].
     */
    fun quantityPayload(
        modelId: String,
        quantity: Int,
        salePrice: BigDecimal,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        notes: String? = null,
        payments: List<AccountAmount> = emptyList(),
    ): JsonObject = buildJsonObject {
        put("modelId", modelId)
        put("quantity", quantity)
        put("salePrice", JsonPrimitive(salePrice))
        appendShared(customerId, customerName, customerPhone, notes, payments)
    }

    /** Customer (id XOR inline), notes and tender lines — shared by both sale forms. */
    private fun kotlinx.serialization.json.JsonObjectBuilder.appendShared(
        customerId: String?,
        customerName: String?,
        customerPhone: String?,
        notes: String?,
        payments: List<AccountAmount>,
    ) {
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
        notes?.trim()?.takeIf { it.isNotEmpty() }?.let { put("notes", it) }
    }

    /**
     * Fan a mixed cart (phones, serial units, quantity products) out into one
     * [SaleOp] per line: the shared customer and notes ride every op; price (and
     * warranty, for a unit) come from the line. A unit op carries its device
     * version as the optimistic-lock token; a quantity op carries none (no lock).
     * Pure — unit-tested.
     */
    fun ops(
        lines: List<CartLine>,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        notes: String? = null,
        payments: List<List<AccountAmount>> = emptyList(),
    ): List<SaleOp> = lines.mapIndexed { i, line ->
        val parts = payments.getOrElse(i) { emptyList() }
        when (line) {
            is CartLine.Unit -> SaleOp(
                payload = payload(
                    imei = line.device.imei,
                    serialNumber = line.device.serialNumber,
                    salePrice = parseMoney(line.salePrice),
                    customerId = customerId,
                    customerName = customerName,
                    customerPhone = customerPhone,
                    warrantyDays = line.warrantyDays.trim().toIntOrNull(),
                    notes = notes,
                    payments = parts,
                ),
                baseVersion = line.device.version,
            )
            is CartLine.Quantity -> SaleOp(
                payload = quantityPayload(
                    modelId = line.product.modelId,
                    quantity = line.quantity,
                    salePrice = line.lineTotal,
                    customerId = customerId,
                    customerName = customerName,
                    customerPhone = customerPhone,
                    notes = notes,
                    payments = parts,
                ),
                baseVersion = null,
            )
        }
    }

    /** IMEI is exactly 15 digits (mirrors the server `CreateSaleDto` rule). */
    fun isValidImei(imei: String): Boolean = imei.matches(Regex("\\d{15}"))
}
