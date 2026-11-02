package uz.malika.erp.shared.lib

import org.junit.Assert.assertEquals
import org.junit.Test

/** RFC-4180 escaping — the one rule that must survive a refactor. */
class CsvTest {

    @Test
    fun quotesFieldsWithSpecialCharsAndDoublesInnerQuotes() {
        val csv = Csv.build(
            headers = listOf("imei", "note"),
            rows = listOf(
                listOf("123", "plain"),
                listOf("456", "has, comma"),
                listOf("789", "has \"quote\""),
                listOf("012", "line\nbreak"),
            ),
        )
        assertEquals(
            listOf(
                "imei,note",
                "123,plain",
                "456,\"has, comma\"",
                "789,\"has \"\"quote\"\"\"",
                "012,\"line\nbreak\"",
            ).joinToString("\r\n"),
            csv,
        )
    }
}
