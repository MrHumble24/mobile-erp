package uz.malika.erp.features.admin.data

import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
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
)

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
        }
        api.updateSettings(body)
    }

    private fun nullableText(v: String) =
        v.trim().ifEmpty { null }?.let { JsonPrimitive(it) } ?: JsonNull
}
