package uz.malika.erp.features.credit.data

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.features.credit.lib.CreditPlan
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.lib.PricedLine
import uz.malika.erp.shared.payments.AccountAmount

/** One planned part the till builds: due `YYYY-MM-DD` and an amount in cents. */
data class PlanPart(val dueDate: String, val amountCents: Long)

/**
 * Pure builder for the `POST /credits` body (ADR 0035). Credit covers a whole
 * cart: one `customerId`, one line per priced cart line (exactly the fields
 * `POST /sales` takes, minus the customer/payments/listPrice it never whitelists
 * on a credit line), the down-payment tender lines, and the instalment plan.
 * No interest/fee field is ever written. Kept free of Android/HTTP for testing.
 */
object CreditCreate {

    fun body(
        priced: List<PricedLine>,
        level: String,
        customerId: String,
        downPayment: List<AccountAmount>,
        plan: List<PlanPart>,
        note: String?,
        clientKey: String,
    ): JsonObject = buildJsonObject {
        put("customerId", customerId)
        put("lines", buildJsonArray { priced.forEach { add(lineOf(it, level)) } })
        if (downPayment.any { it.amount.signum() > 0 }) {
            put(
                "payments",
                buildJsonArray {
                    downPayment.filter { it.amount.signum() > 0 }.forEach { p ->
                        add(buildJsonObject { put("accountCode", p.accountCode); put("amount", JsonPrimitive(p.amount)) })
                    }
                },
            )
        }
        put(
            "instalments",
            buildJsonArray {
                plan.forEach { part ->
                    add(buildJsonObject { put("dueDate", part.dueDate); put("amount", JsonPrimitive(CreditPlan.fromCents(part.amountCents))) })
                }
            },
        )
        note?.trim()?.takeIf { it.isNotEmpty() }?.let { put("note", it) }
        put("clientKey", clientKey)
    }

    private fun lineOf(priced: PricedLine, level: String): JsonObject = buildJsonObject {
        when (val line = priced.line) {
            is CartLine.Unit -> {
                val d = line.device
                if (d.imei != null) put("imei", d.imei) else d.serialNumber?.let { put("serialNumber", it) }
                line.warrantyDays.trim().toIntOrNull()?.let { put("warrantyDays", it) }
            }
            is CartLine.Quantity -> {
                put("modelId", line.product.modelId)
                put("quantity", line.quantity)
            }
        }
        put("salePrice", JsonPrimitive(priced.finalPrice))
        put("priceLevelCode", level)
        priced.effectiveDiscount?.takeIf { it.value.signum() > 0 }?.let { disc ->
            put("discount", buildJsonObject { put("mode", disc.mode.name); put("value", JsonPrimitive(disc.value)) })
        }
    }
}
