package uz.malika.erp.features.repairs.lib

/**
 * The repair ticket state machine (ADR 0040), ported 1:1 from the server's
 * `lib/repair-status.ts` so the till offers only legal next-status buttons and
 * the two never disagree. GIVEN_BACK and CANCELLED are terminal. Pure — unit-tested.
 */
object RepairStatus {

    const val RECEIVED = "RECEIVED"
    const val IN_REPAIR = "IN_REPAIR"
    const val READY = "READY"
    const val GIVEN_BACK = "GIVEN_BACK"
    const val CANCELLED = "CANCELLED"

    val ALL = listOf(RECEIVED, IN_REPAIR, READY, GIVEN_BACK, CANCELLED)

    private val MOVES: Map<String, List<String>> = mapOf(
        RECEIVED to listOf(IN_REPAIR, READY, CANCELLED),
        IN_REPAIR to listOf(READY, RECEIVED, CANCELLED),
        READY to listOf(GIVEN_BACK, IN_REPAIR, CANCELLED),
        GIVEN_BACK to emptyList(),
        CANCELLED to emptyList(),
    )

    private val TERMINAL: Set<String> = setOf(GIVEN_BACK, CANCELLED)

    /** The legal next statuses from [from] (empty for a terminal ticket). */
    fun legalMoves(from: String): List<String> = MOVES[from] ?: emptyList()

    fun isLegalMove(from: String, to: String): Boolean = legalMoves(from).contains(to)

    fun isTerminal(code: String): Boolean = TERMINAL.contains(code)

    /** The i18n key for a status code's label. */
    fun labelKey(code: String): String = when (code) {
        IN_REPAIR -> "repairs.statusInRepair"
        READY -> "repairs.statusReady"
        GIVEN_BACK -> "repairs.statusGivenBack"
        CANCELLED -> "repairs.statusCancelled"
        else -> "repairs.statusReceived"
    }
}
