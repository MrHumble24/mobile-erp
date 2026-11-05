package uz.malika.erp.features.shifts

import org.junit.Assert.assertEquals
import org.junit.Test
import uz.malika.erp.features.shifts.lib.ShiftMath
import java.math.BigDecimal

/** The one client-side shift figure: the close-out difference preview (ADR 0036). */
class ShiftMathTest {

    @Test
    fun differenceIsCountedMinusExpected() {
        // expected 11,500,000; counted 11,480,000 → −20,000 (shortage).
        assertEquals(BigDecimal("-20000"), ShiftMath.difference(BigDecimal("11500000"), BigDecimal("11480000")))
    }

    @Test
    fun differenceFromStringsHandlesBlanks() {
        assertEquals(BigDecimal("11500000"), ShiftMath.difference("", "11500000"))
    }

    @Test
    fun signClassifiesTheDrawer() {
        assertEquals(ShiftMath.Sign.NONE, ShiftMath.sign(ShiftMath.difference("100", "100")))
        assertEquals(ShiftMath.Sign.SHORTAGE, ShiftMath.sign(ShiftMath.difference("100", "90")))
        assertEquals(ShiftMath.Sign.SURPLUS, ShiftMath.sign(ShiftMath.difference("100", "110")))
    }
}
