package uz.malika.erp.features.sales.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.i18n.Translate

/** Shared receipt lines (ADR 0043): header lines and points rows. */
class ReceiptRowsTest {

    private val t: Translate = { key, _ -> key }

    private fun receipt(
        storeName: String? = null,
        storeAddress: String? = null,
        storePhone: String? = null,
    ) = ReceiptData(
        receiptId = "r1",
        soldAt = null,
        cashier = "Ali",
        customerName = null,
        items = emptyList(),
        total = "100",
        warrantyUntil = null,
        storeName = storeName,
        storeAddress = storeAddress,
        storePhone = storePhone,
    )

    @Test
    fun headerAllThree() {
        assertEquals(
            listOf("Malika", "Tashkent", "+998"),
            receiptHeaderLines(receipt("Malika", "Tashkent", "+998")),
        )
    }

    @Test
    fun headerNameOnly() {
        assertEquals(listOf("Malika"), receiptHeaderLines(receipt("Malika", null, "")))
    }

    @Test
    fun headerAllNullIsEmpty() {
        assertTrue(receiptHeaderLines(receipt()).isEmpty())
    }

    @Test
    fun pointsNone() {
        assertTrue(receiptBonusRows(null, null, t).isEmpty())
        assertTrue(receiptBonusRows("0.00", "0.00", t).isEmpty())
    }

    @Test
    fun pointsSpentOnly() {
        assertEquals(
            listOf(PrintRow("sales.paidWithPoints", "-1,450")),
            receiptBonusRows("1450.00", "0.00", t),
        )
    }

    @Test
    fun pointsEarnedOnly() {
        assertEquals(
            listOf(PrintRow("sales.pointsEarned", "1,450")),
            receiptBonusRows("0.00", "1450.00", t),
        )
    }

    @Test
    fun pointsBothInOrder() {
        assertEquals(
            listOf(
                PrintRow("sales.paidWithPoints", "-300"),
                PrintRow("sales.pointsEarned", "1,450"),
            ),
            receiptBonusRows("300.00", "1450.00", t),
        )
    }
}
