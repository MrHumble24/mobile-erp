package uz.malika.erp.features.balance

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import uz.malika.erp.features.balance.data.LedgerTxn

/**
 * A ledger history row's `amount` is null when the row is a cost type and the
 * caller lacks `device.cost.view` (ADR 0028). It must decode to null (shown as
 * `balance.amountHidden`), never crash or coerce to "0". Mirrors HttpClient's Json.
 */
class LedgerAmountDecodeTest {

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    @Test
    fun decodesNullAmountAsNull() {
        val row = json.decodeFromString(
            LedgerTxn.serializer(),
            """{"id":"1","accountCode":"CASH","typeCode":"CUSTOMS","amount":null}""",
        )
        assertNull(row.amount)
    }

    @Test
    fun decodesPresentAmountAsString() {
        val row = json.decodeFromString(
            LedgerTxn.serializer(),
            """{"id":"2","accountCode":"CASH","typeCode":"SALE","amount":"-150000"}""",
        )
        assertEquals("-150000", row.amount)
    }
}
