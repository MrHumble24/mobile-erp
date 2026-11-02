package uz.malika.erp.features.finance.data

import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonPrimitive

/**
 * Reads a money value that the server sends either as a JSON number
 * (computed report aggregates) or a JSON string (Prisma `Decimal` columns) and
 * yields the raw digits as a `String`, so money stays a [java.math.BigDecimal]
 * via `parseMoney`/`formatMoney` and never a float. On a nullable property the
 * serialization plugin wraps this and maps `null`/absent to `null` (e.g. cost
 * fields redacted for under-privileged users).
 */
object FlexMoneySerializer : KSerializer<String> {
    override val descriptor =
        PrimitiveSerialDescriptor("uz.malika.FlexMoney", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: String) = encoder.encodeString(value)

    override fun deserialize(decoder: Decoder): String {
        val json = decoder as? JsonDecoder ?: return "0"
        return (json.decodeJsonElement() as? JsonPrimitive)?.content ?: "0"
    }
}
