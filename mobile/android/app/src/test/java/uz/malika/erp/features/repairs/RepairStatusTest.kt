package uz.malika.erp.features.repairs

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.repairs.lib.RepairStatus

/** The repair state machine (ADR 0040): legal moves only, terminals are dead ends. */
class RepairStatusTest {

    @Test
    fun receivedCanGoToInRepairReadyOrCancelled() {
        assertEquals(listOf("IN_REPAIR", "READY", "CANCELLED"), RepairStatus.legalMoves("RECEIVED"))
        assertTrue(RepairStatus.isLegalMove("RECEIVED", "READY"))
    }

    @Test
    fun inRepairCanGoBackToReceived() {
        assertTrue(RepairStatus.isLegalMove("IN_REPAIR", "RECEIVED"))
        assertTrue(RepairStatus.isLegalMove("IN_REPAIR", "READY"))
        assertTrue(RepairStatus.isLegalMove("IN_REPAIR", "CANCELLED"))
    }

    @Test
    fun readyCanBeGivenBackOrReopened() {
        assertTrue(RepairStatus.isLegalMove("READY", "GIVEN_BACK"))
        assertTrue(RepairStatus.isLegalMove("READY", "IN_REPAIR"))
    }

    @Test
    fun receivedCannotJumpStraightToGivenBack() {
        assertFalse(RepairStatus.isLegalMove("RECEIVED", "GIVEN_BACK"))
    }

    @Test
    fun terminalStatusesHaveNoMoves() {
        assertTrue(RepairStatus.legalMoves("GIVEN_BACK").isEmpty())
        assertTrue(RepairStatus.legalMoves("CANCELLED").isEmpty())
        assertTrue(RepairStatus.isTerminal("GIVEN_BACK"))
        assertTrue(RepairStatus.isTerminal("CANCELLED"))
        assertFalse(RepairStatus.isTerminal("READY"))
    }
}
