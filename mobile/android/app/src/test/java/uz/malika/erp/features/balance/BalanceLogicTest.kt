package uz.malika.erp.features.balance

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.balance.data.LedgerBalances
import uz.malika.erp.features.balance.model.EntryCheck
import uz.malika.erp.features.balance.model.LedgerAction
import uz.malika.erp.features.balance.model.TransferCheck
import uz.malika.erp.features.balance.model.checkEntry
import uz.malika.erp.features.balance.model.checkTransfer

/**
 * Pure store-balance logic on the JVM: the sign/reason rules for a manual entry,
 * the transfer rules, and the balance decode that must read a value whether the
 * server sends it as a JSON number (today) or a decimal string (after the change
 * in progress).
 */
class BalanceLogicTest {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    @Test
    fun decodesBalanceFromNumberOrString() {
        val asNumbers = json.decodeFromString(
            LedgerBalances.serializer(),
            """{"accounts":[{"accountCode":"CASH","label":"Cash","balance":-500000}],"total":-200000}""",
        )
        assertEquals("-500000", asNumbers.accounts.single().balance)
        assertEquals("-200000", asNumbers.total)

        val asStrings = json.decodeFromString(
            LedgerBalances.serializer(),
            """{"accounts":[{"accountCode":"CARD","label":"Card","balance":"300000"}],"total":"100000"}""",
        )
        assertEquals("300000", asStrings.accounts.single().balance)
        assertEquals("100000", asStrings.total)
    }

    @Test
    fun depositRejectsZeroAndNegative() {
        assertTrue(checkEntry(LedgerAction.DEPOSIT, "0", "") is EntryCheck.Error)
        assertTrue(checkEntry(LedgerAction.DEPOSIT, "-5", "") is EntryCheck.Error)
        assertTrue(checkEntry(LedgerAction.DEPOSIT, "  ", "") is EntryCheck.Error)
        val ok = checkEntry(LedgerAction.DEPOSIT, "1500", "")
        assertEquals(1500.0, (ok as EntryCheck.Ok).amount, 0.0)
    }

    @Test
    fun openingAndCorrectionAcceptSignedAmounts() {
        assertTrue(checkEntry(LedgerAction.OPENING, "-500000", "") is EntryCheck.Ok)
        // correction keeps the sign but needs a reason
        val missingReason = checkEntry(LedgerAction.CORRECTION, "-100", "")
        assertEquals("balance.errorReasonRequired", (missingReason as EntryCheck.Error).key)
        assertTrue(checkEntry(LedgerAction.CORRECTION, "-100", "miscount") is EntryCheck.Ok)
        // zero is still rejected
        assertEquals("balance.errorAmountRequired", (checkEntry(LedgerAction.OPENING, "0", "") as EntryCheck.Error).key)
    }

    @Test
    fun transferNeedsPositiveAmountAndTwoAccounts() {
        assertEquals("balance.errorAmountRequired", (checkTransfer("CASH", "CARD", "0") as TransferCheck.Error).key)
        assertEquals("balance.errorSameAccount", (checkTransfer("CASH", "CASH", "100") as TransferCheck.Error).key)
        assertEquals("balance.errorSameAccount", (checkTransfer("CASH", null, "100") as TransferCheck.Error).key)
        val ok = checkTransfer("CASH", "CARD", "250000")
        assertEquals(250000.0, (ok as TransferCheck.Ok).amount, 0.0)
    }
}
