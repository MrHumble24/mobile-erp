package uz.malika.erp.features.customs

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import uz.malika.erp.features.customs.lib.NewListRow
import uz.malika.erp.features.customs.lib.newListError
import uz.malika.erp.features.customs.lib.newListItems

/** New-price-list sheet validation before POST (ADR 0027). Pure, JVM. */
class CustomsValidationTest {

    @Test
    fun rejectsEmptyList() {
        assertEquals("customs.errorNoRows", newListError(emptyList()))
        // Blank-code rows are placeholders, so they count as empty.
        assertEquals("customs.errorNoRows", newListError(listOf(NewListRow(fee = "10"))))
    }

    @Test
    fun rejectsDuplicateCode() {
        val rows = listOf(NewListRow("8517", fee = "10"), NewListRow("8517", fee = "20"))
        assertEquals("customs.errorDuplicateCode", newListError(rows))
    }

    @Test
    fun acceptsDistinctCodesAndDropsBlanks() {
        val rows = listOf(
            NewListRow("8517", "Phones", "10"),
            NewListRow(" ", "placeholder", ""),
            NewListRow("8471", "Tablets", "20"),
        )
        assertNull(newListError(rows))
        val items = newListItems(rows)
        assertEquals(2, items.size)
        assertEquals("8517", items.first().customsCode)
    }
}
