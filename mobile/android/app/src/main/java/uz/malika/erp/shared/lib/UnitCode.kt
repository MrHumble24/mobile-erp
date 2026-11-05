package uz.malika.erp.shared.lib

/**
 * One source of truth for a unit's identifier (ADR 0029). A unit has either an
 * [imei] (phones) or a [serialNumber] (consoles/laptops/watches), never both.
 *
 * - [display] gives the code to show wherever a field covers both (label
 *   `catalog.unitCode`).
 * - [identify] turns a scanned/typed code into the single request field to send:
 *   a valid 15-digit IMEI goes as `imei`, anything else as a normalised
 *   `serialNumber` — so the same scan field drives phones and serial units.
 */
object UnitCode {
    /** Server rule: a serial number is 3-64 letters/digits, no spaces, upper-cased. */
    private val SERIAL = Regex("^[A-Z0-9]{3,64}$")

    /** Trim + upper-case, the server's `normalizeSerial`. */
    fun normalizeSerial(code: String): String = code.trim().uppercase()

    fun isValidSerial(code: String): Boolean = SERIAL.matches(normalizeSerial(code))

    /** Whichever identifier the unit carries; "" when neither (never expected). */
    fun display(imei: String?, serialNumber: String?): String =
        imei?.takeIf { it.isNotBlank() } ?: serialNumber?.takeIf { it.isNotBlank() } ?: ""

    /** Exactly one of the two is non-null: the field to send for this scanned code. */
    data class Identifier(val imei: String?, val serialNumber: String?)

    fun identify(code: String): Identifier {
        val c = code.trim()
        return if (isImei(c)) Identifier(imei = c, serialNumber = null)
        else Identifier(imei = null, serialNumber = normalizeSerial(c))
    }
}
