package uz.malika.erp.features.inventory.data

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import uz.malika.erp.data.local.DeviceEntity
import uz.malika.erp.data.remote.HttpClient
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.ui.theme.Tokens
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Device domain types for the inventory slice. The list item is built from the
 * offline [DeviceEntity] mirror; detail/history come from the online API. Cost
 * is optional — redacted to null for under-privileged users, so the margin row
 * simply hides.
 */
data class DeviceListItem(
    val id: String,
    val imei: String,
    val statusCode: String,
    val modelId: String,
    val modelLabel: String,
    val specs: Map<String, String>,
    val targetPrice: String?,
) {
    val storage: String? get() = specs["storage"]

    /** Search by last digits of the IMEI or the model label (case-insensitive). */
    fun matches(query: String): Boolean {
        if (query.isBlank()) return true
        val q = query.trim().lowercase()
        return imei.lowercase().contains(q) || modelLabel.lowercase().contains(q)
    }

    companion object {
        fun fromEntity(e: DeviceEntity) = DeviceListItem(
            id = e.id,
            imei = e.imei,
            statusCode = e.statusCode,
            modelId = e.modelId,
            modelLabel = "${e.modelBrand} ${e.modelName}".trim(),
            specs = decodeSpecs(e.specs),
            targetPrice = e.targetPrice,
        )
    }
}

data class QcSummary(val passed: Boolean, val gradeCode: String?, val batteryHealth: Int?) {
    companion object {
        fun fromDto(d: QcDto) = QcSummary(d.passed, d.gradeCode, d.batteryHealth)
    }
}

data class DeviceDetail(
    val id: String,
    val imei: String,
    val modelId: String,
    val modelLabel: String,
    val statusCode: String,
    val specs: Map<String, String>,
    val targetPrice: String?,
    val landedCost: String?,
    val intakeDate: String,
    val version: Int,
    val latestInspection: QcSummary?,
) {
    companion object {
        fun fromDto(d: DeviceDetailDto) = DeviceDetail(
            id = d.id,
            imei = d.imei,
            modelId = d.modelId,
            modelLabel = "${d.model?.brand ?: ""} ${d.model?.name ?: ""}".trim(),
            statusCode = d.statusCode,
            specs = decodeSpecs(d.specs?.toString() ?: "{}"),
            targetPrice = d.targetPrice.asScalar(),
            landedCost = d.landedCost.asScalar(),
            intakeDate = d.intakeDate ?: "",
            version = d.version,
            latestInspection = d.latestInspection?.let(QcSummary::fromDto),
        )
    }
}

data class DeviceHistoryEntry(
    val id: String,
    val fromStatusCode: String?,
    val toStatusCode: String,
    val reason: String?,
    val changedAt: String,
) {
    companion object {
        fun fromDto(d: DeviceHistoryDto) =
            DeviceHistoryEntry(d.id, d.fromStatusCode, d.toStatusCode, d.reason, d.changedAt ?: "")
    }
}

/**
 * Status presentation + the manual transitions reachable from the device sheet.
 * CONSIGNED and SOLD targets go through POS / Nasiya, never here, so they are
 * deliberately absent even though the server allows them (ADR 0012).
 */
object DeviceStatusMeta {
    private val labelKeys = mapOf(
        "IN_STOCK" to "inventory.statusInStock",
        "DEFECTIVE" to "inventory.statusDefective",
        "CONSIGNED" to "inventory.statusConsigned",
        "SOLD" to "inventory.statusSold",
    )
    private val manualTransitions = mapOf(
        "IN_STOCK" to listOf("DEFECTIVE"),
        "DEFECTIVE" to listOf("IN_STOCK"),
        "SOLD" to listOf("IN_STOCK", "DEFECTIVE"),
        "CONSIGNED" to emptyList(),
    )

    fun labelKey(code: String): String = labelKeys[code] ?: code

    @Composable
    @ReadOnlyComposable
    fun color(code: String): Color = when (code) {
        "IN_STOCK" -> Tokens.success
        "DEFECTIVE" -> Tokens.danger
        "CONSIGNED" -> Tokens.info
        "SOLD" -> Tokens.mutedForeground
        else -> Tokens.ash
    }

    fun transitionsFor(code: String): List<String> = manualTransitions[code] ?: emptyList()
}

/** Target − landed cost, and the margin as a percent of cost. Pure, so it is tested. */
data class Margin(val amount: BigDecimal, val percent: BigDecimal, val positive: Boolean)

fun inventoryMargin(targetPrice: String?, landedCost: String?): Margin {
    val price = parseMoney(targetPrice)
    val cost = parseMoney(landedCost)
    val amount = price - cost
    val percent = if (cost > BigDecimal.ZERO) {
        amount.divide(cost, 4, RoundingMode.HALF_UP).multiply(BigDecimal(100))
    } else {
        BigDecimal.ZERO
    }
    return Margin(amount, percent, amount.signum() >= 0)
}

/** Decode a stored specs JSON blob to flat string values (scalars only). */
fun decodeSpecs(raw: String): Map<String, String> = try {
    (HttpClient.json.parseToJsonElement(raw) as? JsonObject)
        ?.mapNotNull { (k, v) ->
            (v as? JsonPrimitive)?.takeUnless { it is JsonNull }?.let { k to it.content }
        }
        ?.toMap()
        ?: emptyMap()
} catch (_: Exception) {
    emptyMap()
}

private fun kotlinx.serialization.json.JsonElement?.asScalar(): String? =
    (this as? JsonPrimitive)?.takeUnless { it is JsonNull }?.content
