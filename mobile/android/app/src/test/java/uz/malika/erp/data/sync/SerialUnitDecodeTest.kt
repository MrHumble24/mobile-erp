package uz.malika.erp.data.sync

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import uz.malika.erp.data.remote.DeviceSyncDto
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.shared.payments.AccountAmount
import java.math.BigDecimal

/** A serial unit decodes with a null imei and maps to the cache (ADR 0029). */
class SerialUnitDecodeTest {
    private val json = Json { ignoreUnknownKeys = true }

    @Test fun decodesAChangeWithNullImei() {
        val raw = """
            {"id":"d1","serialNumber":"SW52MM","statusCode":"IN_STOCK","version":2,
             "updatedAt":"2026-11-05T00:00:00Z",
             "model":{"id":"m1","brand":"Apple","name":"Watch","kindCode":"SERIAL"}}
        """.trimIndent()

        val dto = json.decodeFromString(DeviceSyncDto.serializer(), raw)
        assertNull(dto.imei)
        assertEquals("SW52MM", dto.serialNumber)

        val entity = ChangesMapper.device(dto)
        assertNull(entity.imei)
        assertEquals("SW52MM", entity.serialNumber)
        assertEquals("SERIAL", entity.kindCode)
    }

    @Test fun saleOfASerialUnitSendsSerialNotImei() {
        val payload = SaleCreate.payload(
            imei = null,
            serialNumber = "SW52MM",
            salePrice = BigDecimal("100"),
            payments = emptyList<AccountAmount>(),
        )
        assertNull(payload["imei"])
        assertEquals("SW52MM", payload["serialNumber"]?.toString()?.trim('"'))
    }
}
