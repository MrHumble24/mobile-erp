package uz.malika.erp

import org.junit.Assert.assertEquals
import uz.malika.erp.i18n.I18n
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import java.math.BigDecimal
import org.junit.Test

/**
 * Non-trivial foundation logic that runs on the JVM: i18n lookup (locale →
 * uz → en → raw key) + `{param}` interpolation, and money parse/format.
 */
class FoundationTest {

    private val i18n = I18n(
        mapOf(
            "uz" to mapOf("nav" to mapOf("pos" to "Kassa", "hello" to "Salom, {name}")),
            "en" to mapOf("nav" to mapOf("pos" to "POS", "only_en" to "English only")),
        ),
    )

    @Test
    fun usesCurrentLocale() {
        assertEquals("Kassa", i18n.t("uz", "nav.pos"))
        assertEquals("POS", i18n.t("en", "nav.pos"))
    }

    @Test
    fun fallsBackThroughUzThenEnThenRawKey() {
        // Missing in uz, present in en → en fallback keeps it readable.
        assertEquals("English only", i18n.t("uz", "nav.only_en"))
        // Missing everywhere → the raw key.
        assertEquals("nav.missing", i18n.t("uz", "nav.missing"))
        // No namespace separator → returned as-is.
        assertEquals("bareword", i18n.t("uz", "bareword"))
    }

    @Test
    fun interpolatesParams() {
        assertEquals("Salom, Ali", i18n.t("uz", "nav.hello", mapOf("name" to "Ali")))
    }

    @Test
    fun moneyFormatsWithGroupingAndOptionalCents() {
        assertEquals("$1,250", formatMoney("1250"))
        assertEquals("$1,250.50", formatMoney("1250.5"))
        assertEquals(BigDecimal.ZERO, parseMoney(null))
        assertEquals(BigDecimal.ZERO, parseMoney("garbage"))
    }
}
