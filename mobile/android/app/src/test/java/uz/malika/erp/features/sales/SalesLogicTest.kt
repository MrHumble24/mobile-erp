package uz.malika.erp.features.sales

import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.data.totalPrice
import uz.malika.erp.features.sales.lib.remainingWarrantyDays
import java.math.BigDecimal

private fun device(imei: String, version: Int) = ScannedDevice(
    id = "d-$imei", imei = imei, version = version, statusCode = "IN_STOCK",
    modelLabel = "iPhone", targetPrice = null,
)

/** Pure POS/sales logic that must survive a refactor: payload shape + warranty math. */
class SalesLogicTest {

    @Test
    fun inlineCustomerPayloadOmitsAbsentOptionals() {
        val p = SaleCreate.payload(
            imei = "123456789012345",
            salePrice = BigDecimal("250.00"),
            customerName = "Ali",
            customerPhone = "901234567",
            warrantyDays = 30,
        )
        assertEquals("123456789012345", p["imei"]!!.jsonPrimitive.content)
        assertEquals("250.00", p["salePrice"]!!.jsonPrimitive.content)
        assertEquals("Ali", p["customer"]!!.jsonObject["name"]!!.jsonPrimitive.content)
        assertEquals("901234567", p["customer"]!!.jsonObject["phone"]!!.jsonPrimitive.content)
        assertEquals(30, p["warrantyDays"]!!.jsonPrimitive.content.toInt())
        assertNull(p["notes"]) // omitted when blank
        assertNull(p["customerId"]) // mutually exclusive with inline customer
    }

    @Test
    fun customerIdWinsOverInline() {
        val p = SaleCreate.payload(
            imei = "123456789012345",
            salePrice = BigDecimal("10"),
            customerId = "cust-1",
            customerName = "Ignored",
        )
        assertEquals("cust-1", p["customerId"]!!.jsonPrimitive.content)
        assertNull(p["customer"])
    }

    @Test
    fun walkInHasNoCustomerKeys() {
        val p = SaleCreate.payload(imei = "123456789012345", salePrice = BigDecimal("10"))
        assertNull(p["customer"])
        assertNull(p["customerId"])
    }

    @Test
    fun imeiMustBe15Digits() {
        assertTrue(SaleCreate.isValidImei("123456789012345"))
        assertFalse(SaleCreate.isValidImei("12345"))
        assertFalse(SaleCreate.isValidImei("12345678901234a"))
    }

    @Test
    fun cartFansIntoOneOpPerDeviceWithItsVersion() {
        val lines = listOf(
            CartLine(device("123456789012345", version = 3), salePrice = "100", warrantyDays = "30"),
            CartLine(device("543210987654321", version = 7), salePrice = "250.50", warrantyDays = ""),
        )
        val ops = SaleCreate.ops(lines, customerId = "cust-1", notes = "paid cash")

        assertEquals(2, ops.size)
        // Each op carries its own device version as the optimistic-lock token.
        assertEquals(3, ops[0].baseVersion)
        assertEquals(7, ops[1].baseVersion)
        // Line values flow into the payload; the shared customer rides every op.
        assertEquals("123456789012345", ops[0].payload["imei"]!!.jsonPrimitive.content)
        assertEquals("100", ops[0].payload["salePrice"]!!.jsonPrimitive.content)
        assertEquals(30, ops[0].payload["warrantyDays"]!!.jsonPrimitive.content.toInt())
        assertEquals("cust-1", ops[0].payload["customerId"]!!.jsonPrimitive.content)
        assertEquals("paid cash", ops[1].payload["notes"]!!.jsonPrimitive.content)
        // Blank warranty days are omitted, not sent as 0.
        assertNull(ops[1].payload["warrantyDays"])
    }

    @Test
    fun cartTotalSumsLinePrices() {
        val lines = listOf(
            CartLine(device("1", 1), salePrice = "100", warrantyDays = ""),
            CartLine(device("2", 1), salePrice = "250.50", warrantyDays = ""),
        )
        assertEquals("350.50", lines.totalPrice())
    }

    @Test
    fun warrantyRemainingCeilsAndFloors() {
        val now = 1_000_000_000_000L
        val day = 86_400_000L
        assertEquals(0, remainingWarrantyDays(now, now)) // expired exactly now
        assertEquals(0, remainingWarrantyDays(now - day, now)) // past
        assertEquals(1, remainingWarrantyDays(now + 1, now)) // partial day counts as 1
        assertEquals(10, remainingWarrantyDays(now + 10 * day, now))
    }
}
