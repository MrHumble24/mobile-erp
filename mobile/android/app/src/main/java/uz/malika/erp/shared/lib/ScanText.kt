package uz.malika.erp.shared.lib

/**
 * Reads codes out of camera OCR text (box label, *#06# screen, price tag).
 * Printed numbers are often grouped ("35 209900 176148 1", "35-209900-176148-1"),
 * so for IMEIs single spaces/dashes between digits are dropped. Mirrors iOS `ScanText.swift`.
 */
object ScanText {
    private val GROUPED_RUN = Regex("\\d(?:[ -]?\\d)*")
    /** No spaces: on a label, "A2890 128GB" is two numbers, not one. */
    private val WORD_RUN = Regex("\\d(?:-?\\d)*")
    private const val IMEI_LENGTH = 15
    private const val MIN_NUMBER_DIGITS = 4

    /** First Luhn-valid 15-digit IMEI: the check digit rejects misreads and random numbers. */
    fun imei(text: String): String? =
        runs(text, GROUPED_RUN).flatMap(::windows).firstOrNull(::isLuhnValid)

    /** Every number of 4+ digits (one per printed word), in reading order, no repeats — for the user to pick from. */
    fun numbers(text: String): List<String> =
        runs(text, WORD_RUN).filter { it.length >= MIN_NUMBER_DIGITS }.distinct().toList()

    private fun runs(text: String, pattern: Regex): Sequence<String> =
        pattern.findAll(text).map { it.value.filter(Char::isDigit) }

    /** A run longer than 15 can hold an IMEI glued to other digits. */
    private fun windows(digits: String): Sequence<String> =
        if (digits.length < IMEI_LENGTH) emptySequence()
        else (0..digits.length - IMEI_LENGTH).asSequence().map { digits.substring(it, it + IMEI_LENGTH) }

    fun isLuhnValid(digits: String): Boolean {
        if (digits.length != IMEI_LENGTH || !digits.all(Char::isDigit)) return false
        val sum = digits.reversed().mapIndexed { i, c ->
            val d = c - '0'
            if (i % 2 == 1) (d * 2).let { if (it > 9) it - 9 else it } else d
        }.sum()
        return sum % 10 == 0
    }
}
