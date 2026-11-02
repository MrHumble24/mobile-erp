package uz.malika.erp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.core.DevHost
import uz.malika.erp.core.logging.NetworkMask
import uz.malika.erp.core.logging.RingBuffer

/**
 * Pure Developer-Console logic that runs on the JVM: the ring buffer's cap +
 * order, secret masking (Authorization header + password field) and truncation,
 * and the emulator/auto dev-URL resolution.
 */
class DevConsoleLogicTest {

    @Test
    fun ringBufferKeepsLastNInOrder() {
        val buffer = RingBuffer<Int>(3)
        (1..5).forEach(buffer::add)
        assertEquals(listOf(3, 4, 5), buffer.items.value) // oldest dropped, order preserved
        buffer.clear()
        assertEquals(emptyList<Int>(), buffer.items.value)
    }

    @Test
    fun masksAuthorizationHeaderCaseInsensitive() {
        val masked = NetworkMask.maskHeaders(mapOf("authorization" to "Bearer secret", "Accept" to "json"))
        assertEquals("***", masked["authorization"])
        assertEquals("json", masked["Accept"])
    }

    @Test
    fun masksPasswordJsonField() {
        val body = """{"email":"a@b.uz","password":"hunter2"}"""
        assertEquals("""{"email":"a@b.uz","password":"***"}""", NetworkMask.maskBody(body))
    }

    @Test
    fun truncatesOversizeBodies() {
        val big = "x".repeat(NetworkMask.MAX_BODY + 100)
        val out = NetworkMask.truncate(big)!!
        assertTrue(out.length < big.length)
        assertTrue(out.contains("truncated"))
    }

    @Test
    fun resolvesEmulatorAndLanHosts() {
        assertTrue(DevHost.isEmulator("generic/sdk_gphone64", "sdk_gphone64_x86", "sdk_gphone64", "ranchu"))
        assertFalse(DevHost.isEmulator("google/raven", "Pixel 6 Pro", "raven", "raven"))
        assertEquals("10.0.2.2", DevHost.resolveHost(isEmulator = true, buildHost = "192.168.1.9"))
        assertEquals("192.168.1.9", DevHost.resolveHost(isEmulator = false, buildHost = "192.168.1.9"))
        assertEquals("http://192.168.1.9:3000", DevHost.devUrl("192.168.1.9", 3000))
    }
}
