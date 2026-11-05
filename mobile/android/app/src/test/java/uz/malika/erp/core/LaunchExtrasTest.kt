package uz.malika.erp.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The debug launch-extra parser (adb am start → dev host / login / open route). */
class LaunchExtrasTest {

    private fun parse(vararg pairs: Pair<String, String?>): LaunchExtras? {
        val map = pairs.toMap()
        return LaunchExtras.parse { map[it] }
    }

    @Test
    fun noExtrasIsNull() {
        assertNull(parse())
        assertNull(parse("devHost" to "", "devEmail" to "   ", "open" to ""))
    }

    @Test
    fun parsesAllFieldsAndTrimsAllButPassword() {
        val e = parse(
            "devHost" to " 127.0.0.1 ",
            "devEmail" to " owner@malika.uz ",
            "devPassword" to " secret with spaces ",
            "open" to " balance ",
        )!!
        assertEquals("127.0.0.1", e.host)
        assertEquals("owner@malika.uz", e.email)
        assertEquals(" secret with spaces ", e.password) // passwords are used verbatim
        assertEquals("balance", e.open)
        assertTrue(e.canSignIn)
    }

    @Test
    fun eachExtraIsIndependent() {
        val hostOnly = parse("devHost" to "10.0.2.2")!!
        assertEquals("10.0.2.2", hostOnly.host)
        assertNull(hostOnly.email)
        assertFalse(hostOnly.canSignIn)

        val openOnly = parse("open" to "pos")!!
        assertEquals("pos", openOnly.open)
        assertNull(openOnly.host)
    }

    @Test
    fun canSignInNeedsBothEmailAndPassword() {
        assertFalse(parse("devEmail" to "a@b.c")!!.canSignIn)
        assertFalse(parse("devPassword" to "x")!!.canSignIn)
        assertTrue(parse("devEmail" to "a@b.c", "devPassword" to "x")!!.canSignIn)
    }
}
