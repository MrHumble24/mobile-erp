package uz.malika.erp.core.logging

import kotlinx.coroutines.flow.StateFlow
import java.util.concurrent.atomic.AtomicLong

/**
 * In-memory capture of the last 300 HTTP exchanges (no persistence), fed by the
 * OkHttp logging interceptor and read live by the Developer Console's Network
 * section. Entries arrive already masked + truncated (see [NetworkMask]).
 */
object NetworkLog {

    private const val CAPACITY = 300
    private val buffer = RingBuffer<NetworkEntry>(CAPACITY)
    private val seq = AtomicLong(0)

    val entries: StateFlow<List<NetworkEntry>> = buffer.items

    /** Next monotonic id; the interceptor stamps the entry it will later record. */
    fun nextId(): Long = seq.incrementAndGet()

    fun record(entry: NetworkEntry) = buffer.add(entry)

    fun clear() = buffer.clear()
}
