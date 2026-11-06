package uz.malika.erp.features.orders.lib

import java.time.Instant

enum class TimeAgoUnit {
    JUST_NOW,
    MINUTES,
    HOURS,
    DAYS,
}

data class TimeAgoResult(
    val unit: TimeAgoUnit,
    val value: Long = 0,
)

object OrderTimeFormat {

    /**
     * Compute relative time buckets from epoch milliseconds.
     * Pure function easily testable without Android or network dependencies.
     */
    fun computeTimeAgo(createdAtEpochMs: Long, nowEpochMs: Long): TimeAgoResult {
        val diffMs = (nowEpochMs - createdAtEpochMs).coerceAtLeast(0)
        val seconds = diffMs / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val days = hours / 24

        return when {
            minutes < 1 -> TimeAgoResult(TimeAgoUnit.JUST_NOW)
            hours < 1 -> TimeAgoResult(TimeAgoUnit.MINUTES, minutes)
            days < 1 -> TimeAgoResult(TimeAgoUnit.HOURS, hours)
            else -> TimeAgoResult(TimeAgoUnit.DAYS, days)
        }
    }

    /** Parses ISO-8601 string to epoch milliseconds, or null if malformed. */
    fun parseIsoToEpochMs(isoString: String): Long? {
        return try {
            Instant.parse(isoString).toEpochMilli()
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Formats relative time given an ISO string, current time in ms, and a translation function.
     */
    fun format(
        createdAtIso: String,
        nowEpochMs: Long,
        translate: (String, Map<String, Any?>?) -> String,
    ): String {
        val epoch = parseIsoToEpochMs(createdAtIso) ?: return createdAtIso
        val ago = computeTimeAgo(epoch, nowEpochMs)
        return when (ago.unit) {
            TimeAgoUnit.JUST_NOW -> translate("orders.timeJustNow", null)
            TimeAgoUnit.MINUTES -> translate("orders.timeMinutesAgo", mapOf("m" to ago.value.toString()))
            TimeAgoUnit.HOURS -> translate("orders.timeHoursAgo", mapOf("h" to ago.value.toString()))
            TimeAgoUnit.DAYS -> translate("orders.timeDaysAgo", mapOf("d" to ago.value.toString()))
        }
    }
}
