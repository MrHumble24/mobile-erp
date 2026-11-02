package uz.malika.erp.core.logging

import android.util.Log
import kotlinx.coroutines.flow.StateFlow
import java.util.concurrent.atomic.AtomicLong

/**
 * App-event log: a thin facade over Logcat plus an in-memory [RingBuffer] (500,
 * no persistence) the Developer Console reads live. Call it with one-liners at
 * existing call sites — auth, sync, outbox, connectivity, env switches, errors.
 */
object AppLog {

    private const val CAPACITY = 500
    private val buffer = RingBuffer<LogEntry>(CAPACITY)
    private val seq = AtomicLong(0)

    val entries: StateFlow<List<LogEntry>> = buffer.items

    fun d(tag: String, message: String) = log(LogLevel.D, tag, message, null)
    fun i(tag: String, message: String) = log(LogLevel.I, tag, message, null)
    fun w(tag: String, message: String, t: Throwable? = null) = log(LogLevel.W, tag, message, t)
    fun e(tag: String, message: String, t: Throwable? = null) = log(LogLevel.E, tag, message, t)

    fun clear() = buffer.clear()

    private fun log(level: LogLevel, tag: String, message: String, t: Throwable?) {
        buffer.add(
            LogEntry(
                id = seq.incrementAndGet(),
                timeMs = System.currentTimeMillis(),
                level = level,
                tag = tag,
                message = message,
                error = t?.message,
            ),
        )
        // Guarded: android.util.Log is not mocked under plain JVM unit tests.
        runCatching {
            when (level) {
                LogLevel.D -> Log.d(tag, message)
                LogLevel.I -> Log.i(tag, message)
                LogLevel.W -> Log.w(tag, message, t)
                LogLevel.E -> Log.e(tag, message, t)
            }
        }
    }
}
