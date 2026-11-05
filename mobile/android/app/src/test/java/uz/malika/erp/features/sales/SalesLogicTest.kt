package uz.malika.erp.features.sales

import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.CartProduct
import uz.malika.erp.features.sales.data.ModelRefDto
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.data.SaleDto
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.data.toDomain
import uz.malika.erp.features.sales.data.totalPrice
import uz.malika.erp.features.sales.lib.remainingWarrantyDays
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.PaymentSplit
import java.math.BigDecimal

private fun device(imei: String, version: Int) = ScannedDevice(
    id = "d-$imei", imei = imei, version = version, statusCode = "IN_STOCK",
    modelLabel = "iPhone", targetPrice = null,
)

private fun unitLine(imei: String, version: Int, price: String, warranty: String = "") =
    CartLine.Unit(device(imei, version), salePrice = price, warrantyDays = warranty)

private fun product(id: String, inStock: Int = 10) =
    CartProduct(modelId = id, brand = "Brand", name = "Cable", barcode = "BC-$id", salePrice = "50", inStock = inStock)

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
            unitLine("123456789012345", version = 3, price = "100", warranty = "30"),
            unitLine("543210987654321", version = 7, price = "250.50"),
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
            unitLine("1", 1, "100"),
            unitLine("2", 1, "250.50"),
        )
        assertEquals("350.50", lines.totalPrice())
    }

    @Test
    fun mixedCartTotalIncludesQuantityLineTotals() {
        // A phone at 100 and 3 cables at 50 each = 150, so 250 in all.
        val lines = listOf(
            unitLine("123456789012345", 1, "100"),
            CartLine.Quantity(product("cable"), quantity = 3, unitPrice = "50"),
        )
        assertEquals("250", lines.totalPrice())
    }

    @Test
    fun mixedCartSplitAllocatesLineByLineInOrder() {
        // Cart order: phone 100, cables 3×50=150. Split Cash 100 + Card 150.
        val lines = listOf(
            unitLine("123456789012345", version = 4, price = "100"),
            CartLine.Quantity(product("cable"), quantity = 3, unitPrice = "50"),
        )
        val parts = listOf(AccountAmount("CASH", BigDecimal("100")), AccountAmount("CARD", BigDecimal("150")))
        val allocation = PaymentSplit.allocate(lines.map { it.lineTotal }, parts)

        // The phone drains CASH; the cables are paid from CARD.
        assertEquals(1, allocation[0].size)
        assertEquals("CASH", allocation[0][0].accountCode)
        assertEquals(BigDecimal("100"), allocation[0][0].amount)
        assertEquals(1, allocation[1].size)
        assertEquals("CARD", allocation[1][0].accountCode)
        assertEquals(BigDecimal("150"), allocation[1][0].amount)

        val ops = SaleCreate.ops(lines, payments = allocation)
        assertEquals(2, ops.size)
        // The unit op keeps its version; the quantity op carries no lock.
        assertEquals(4, ops[0].baseVersion)
        assertNull(ops[1].baseVersion)
        // The quantity op sends modelId + quantity + the line total, no warranty.
        assertEquals("cable", ops[1].payload["modelId"]!!.jsonPrimitive.content)
        assertEquals(3, ops[1].payload["quantity"]!!.jsonPrimitive.content.toInt())
        assertEquals("150", ops[1].payload["salePrice"]!!.jsonPrimitive.content)
        assertNull(ops[1].payload["warrantyDays"])
        // Each line's own payments sum to its own total.
        assertEquals("100", ops[0].payload["payments"]!!.jsonArray[0].jsonObject["amount"]!!.jsonPrimitive.content)
        assertEquals("150", ops[1].payload["payments"]!!.jsonArray[0].jsonObject["amount"]!!.jsonPrimitive.content)
    }

    @Test
    fun quantitySaleDecodesWithNullDevice() {
        // A quantity sale has no device: the product rides `model` + `quantity`.
        val sale = SaleDto(
            id = "s-1",
            device = null,
            model = ModelRefDto(brand = "Anker", name = "Cable", kindCode = "QUANTITY"),
            quantity = 3,
            salePrice = "150",
        ).toDomain()

        assertTrue(sale.isQuantity)
        assertEquals(3, sale.quantity)
        assertEquals("Anker Cable", sale.modelLabel)
        assertEquals("", sale.code) // no IMEI/serial for a quantity sale
        assertNull(sale.imei)
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
