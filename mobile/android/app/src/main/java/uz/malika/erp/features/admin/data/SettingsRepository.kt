package uz.malika.erp.features.admin.data

import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.core.runApi

/** Store-settings form values (text as typed; parsed/validated on submit). */
data class SettingsForm(
    val storeName: String,
    val storeAddress: String,
    val storePhone: String,
    val receiptFooter: String,
    val telegramChatId: String,
    val closingTime: String,
    val defaultWarrantyDays: String,
    val minMarginPercent: String,
    val lowStockThreshold: String,
    val defaultNasiyaDueDays: String,
    val overdueReminderDays: String,
    // Discounts (ADR 0034). Presets are comma-separated values, capped at 5.
    val discountsEnabled: Boolean = false,
    val discountPercentAllowed: Boolean = true,
    val discountAmountAllowed: Boolean = true,
    val discountPresetsPercent: String = "",
    val discountPresetsAmount: String = "",
    val maxDiscountPercent: String = "0",
    // Customer credit (ADR 0035). `defaultCreditLimit` blank = no cap.
    val customerCreditEnabled: Boolean = false,
    val defaultCreditLimit: String = "",
    // Cashier shifts (ADR 0036).
    val shiftsEnabled: Boolean = false,
    // Bonus points (ADR 0043): percents are numbers, 0-100, at most 2 decimals.
    val bonusEnabled: Boolean = false,
    val bonusEarnPercent: String = "0",
    val bonusMaxRedeemPercent: String = "0",
    // Receipt / price-tag printing (ADR 0043).
    val receiptPrintingEnabled: Boolean = false,
    val receiptPaperWidthMm: String = "80",
    val priceTagsEnabled: Boolean = false,
    // Repairs (ADR 0040).
    val repairsEnabled: Boolean = false,
)

/** Parse a comma-separated preset list into at most five non-negative numbers. */
private fun csvPresets(raw: String): List<Double> =
    raw.split(',').mapNotNull { it.trim().toDoubleOrNull()?.takeIf { v -> v >= 0 } }.take(5)

/**
 * The only place that talks to `/settings`. The PUT body is built as explicit
 * JSON so an emptied optional field is sent as `null` (clearing it) and the
 * numeric fields keep their server-expected number types.
 */
class SettingsRepository(private val api: AdminApi) {

    suspend fun get(): StoreSettingsDto = runApi { api.settings() }

    suspend fun update(form: SettingsForm): StoreSettingsDto = runApi {
        val body = buildJsonObject {
            put("storeName", nullableText(form.storeName))
            put("storeAddress", nullableText(form.storeAddress))
            put("storePhone", nullableText(form.storePhone))
            put("receiptFooter", nullableText(form.receiptFooter))
            put("telegramChatId", nullableText(form.telegramChatId))
            put("closingTime", JsonPrimitive(form.closingTime.trim()))
            put("defaultWarrantyDays", JsonPrimitive(form.defaultWarrantyDays.trim().toInt()))
            put("minMarginPercent", JsonPrimitive(form.minMarginPercent.trim().toDouble()))
            put("lowStockThreshold", JsonPrimitive(form.lowStockThreshold.trim().toInt()))
            put("defaultNasiyaDueDays", JsonPrimitive(form.defaultNasiyaDueDays.trim().toInt()))
            put("overdueReminderDays", JsonPrimitive(form.overdueReminderDays.trim().toInt()))
            put("discountsEnabled", JsonPrimitive(form.discountsEnabled))
            put("discountPercentAllowed", JsonPrimitive(form.discountPercentAllowed))
            put("discountAmountAllowed", JsonPrimitive(form.discountAmountAllowed))
            put("discountPresetsPercent", buildJsonArray { csvPresets(form.discountPresetsPercent).forEach { add(JsonPrimitive(it)) } })
            put("discountPresetsAmount", buildJsonArray { csvPresets(form.discountPresetsAmount).forEach { add(JsonPrimitive(it)) } })
            put("maxDiscountPercent", JsonPrimitive(form.maxDiscountPercent.trim().toDoubleOrNull() ?: 0.0))
            put("customerCreditEnabled", JsonPrimitive(form.customerCreditEnabled))
            put("defaultCreditLimit", form.defaultCreditLimit.trim().toDoubleOrNull()?.let { JsonPrimitive(it) } ?: JsonNull)
            put("shiftsEnabled", JsonPrimitive(form.shiftsEnabled))
            put("repairsEnabled", JsonPrimitive(form.repairsEnabled))
            // Bonus points (ADR 0043): percents sent as numbers.
            put("bonusEnabled", JsonPrimitive(form.bonusEnabled))
            put("bonusEarnPercent", JsonPrimitive(form.bonusEarnPercent.trim().toDoubleOrNull() ?: 0.0))
            put("bonusMaxRedeemPercent", JsonPrimitive(form.bonusMaxRedeemPercent.trim().toDoubleOrNull() ?: 0.0))
            // Printing (ADR 0043): width sent as the number 58 or 80.
            put("receiptPrintingEnabled", JsonPrimitive(form.receiptPrintingEnabled))
            put("receiptPaperWidthMm", JsonPrimitive(form.receiptPaperWidthMm.trim().toIntOrNull() ?: 80))
            put("priceTagsEnabled", JsonPrimitive(form.priceTagsEnabled))
        }
        api.updateSettings(body)
    }

    private fun nullableText(v: String) =
        v.trim().ifEmpty { null }?.let { JsonPrimitive(it) } ?: JsonNull
}
