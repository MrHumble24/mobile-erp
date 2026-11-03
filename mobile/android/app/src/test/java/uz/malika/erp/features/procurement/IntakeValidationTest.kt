package uz.malika.erp.features.procurement

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.procurement.data.AttributeDefDto
import uz.malika.erp.features.procurement.lib.imeiSlotsFilled
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

    @Test
    fun dualSimRequiresValidSecondImei() {
        val base = { imei2: String?, dual: Boolean ->
            validateIntake("123456789012345", true, 100.0, emptyList(), emptyMap(), imei2, dual)
        }
        assertEquals("inventory.imei2Required", base(null, true)) // dual on + missing
        assertEquals("inventory.imei2Required", base("  ", true)) // blank counts as missing
        assertEquals("shipments.imeiLength", base("123", true)) // wrong length
        assertEquals("inventory.imei2Mismatch", base("123456789012345", true)) // equals IMEI 1
        assertNull(base("123456789012346", true)) // valid pair
        assertNull(base(null, false)) // ignored when toggle off
    }

    @Test
    fun dualOnWithOnlyImei1IsNotCompleteButHasNoFillError() {
        // New scan flow: filling IMEI 1 only checks length — a 15-digit IMEI 1 is
        // a valid fill (no error) even with Dual SIM on, but the unit is not yet
        // complete, so the confirm sheet must not open.
        assertTrue(isValidImei("123456789012345")) // fill-time check passes
        assertFalse(imeiSlotsFilled("123456789012345", null, dualSim = true)) // imei2 still empty
        assertFalse(imeiSlotsFilled("123456789012345", "  ", dualSim = true)) // blank imei2
        assertTrue(imeiSlotsFilled("123456789012345", "123456789012346", dualSim = true)) // both filled
        assertTrue(imeiSlotsFilled("123456789012345", null, dualSim = false)) // single-SIM complete
        assertFalse(imeiSlotsFilled("", null, dualSim = false)) // nothing scanned yet
    }
}
