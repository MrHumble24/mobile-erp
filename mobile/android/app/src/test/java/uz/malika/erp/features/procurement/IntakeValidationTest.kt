package uz.malika.erp.features.procurement

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.procurement.data.AttributeDefDto
import uz.malika.erp.features.procurement.lib.isValidImei
import uz.malika.erp.features.procurement.lib.isValidLookupCode
import uz.malika.erp.features.procurement.lib.validateIntake

/** Pure procurement rules: IMEI shape, lookup-code shape, intake validation. */
class IntakeValidationTest {

    @Test
    fun imeiMustBeExactly15Digits() {
        assertTrue(isValidImei("123456789012345"))
        assertTrue(isValidImei("  123456789012345  ")) // trimmed
        assertFalse(isValidImei("12345678901234")) // 14
        assertFalse(isValidImei("1234567890123456")) // 16
        assertFalse(isValidImei("12345678901234a"))
    }

    @Test
    fun lookupCodeMustBeUpperSnake() {
        assertTrue(isValidLookupCode("SCREEN_CRACK"))
        assertTrue(isValidLookupCode("A1"))
        assertFalse(isValidLookupCode("lower"))
        assertFalse(isValidLookupCode("1STARTS_DIGIT"))
        assertFalse(isValidLookupCode(""))
    }

    private val required = listOf(AttributeDefDto("storage", "Storage", "select", listOf("128"), required = true))

    @Test
    fun validIntakePassesWithRequiredSpec() {
        assertNull(validateIntake("123456789012345", true, 100.0, required, mapOf("storage" to "128")))
    }

    @Test
    fun intakeReportsFirstFailureAsI18nKey() {
        assertEquals("shipments.imeiLength", validateIntake("bad", true, 100.0, required, mapOf("storage" to "128")))
        assertEquals("shipments.selectModel", validateIntake("123456789012345", false, 100.0, emptyList(), emptyMap()))
        assertEquals("shipments.acquisitionCost", validateIntake("123456789012345", true, null, emptyList(), emptyMap()))
        assertEquals("shipments.acquisitionCost", validateIntake("123456789012345", true, -1.0, emptyList(), emptyMap()))
        assertEquals("shipments.invalidSpecs", validateIntake("123456789012345", true, 100.0, required, emptyMap()))
    }
}
