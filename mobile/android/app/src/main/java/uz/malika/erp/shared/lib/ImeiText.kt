package uz.malika.erp.shared.lib

/**
 * Finds an IMEI in OCR text (box label, *#06# screen, settings page).
 * Printed IMEIs are often grouped ("35 209900 176148 1", "35-209900-176148-1"),
 * so single spaces/dashes between digits are dropped. Only Luhn-valid 15-digit
 * runs count: the check digit rejects OCR misreads and random numbers.
 */
object ImeiText {
    private val DIGIT_RUN = Regex("\\d(?:[ -]?\\d)*")

    fun find(text: String): String? =
        DIGIT_RUN.findAll(text)
            .map { it.value.filter(Char::isDigit) }
            .flatMap(::windows)
            .firstOrNull(::isLuhnValid)

    /** A run longer than 15 can hold an IMEI glued to other digits. */
    private fun windows(digits: String): Sequence<String> =
        if (digits.length < 15) emptySequence()
        else (0..digits.length - 15).asSequence().map { digits.substring(it, it + 15) }

    fun isLuhnValid(digits: String): Boolean {
        if (digits.length != 15 || !digits.all(Char::isDigit)) return false
        val sum = digits.reversed().mapIndexed { i, c ->
            val d = c - '0'
            if (i % 2 == 1) (d * 2).let { if (it > 9) it - 9 else it } else d
        }.sum()
        return sum % 10 == 0
    }
}
