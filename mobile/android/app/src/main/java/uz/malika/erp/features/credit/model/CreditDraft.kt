package uz.malika.erp.features.credit.model

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import uz.malika.erp.features.credit.data.PlanPart
import uz.malika.erp.features.credit.lib.CreditPlan
import java.time.LocalDate
import java.time.ZoneOffset

/** One editable plan row in the till's credit draft. */
data class InstalmentRow(val id: Int, val dueDate: String, val amount: String)

/**
 * The till's credit draft (ADR 0035): the payment plan the seller fills evenly or
 * edits by hand. Down payment is held by the sheet (it reuses the shared payment
 * control); this owns only the plan. All arithmetic is cent-exact via [CreditPlan]
 * so the till blocks before the server does. No interest/fee anywhere.
 */
class CreditDraft(private val dueTotalCents: Long) {

    var partsText by mutableStateOf("1")
    var firstDue by mutableStateOf(defaultFirstDue())
    var frequency by mutableStateOf(CreditPlan.Frequency.MONTH)

    private var nextId = 1
    val rows = mutableStateListOf(InstalmentRow(0, defaultFirstDue(), CreditPlan.fromCents(dueTotalCents).toPlainString()))

    /** Replace the rows with an even plan over (cart total − down payment). */
    fun applyEven(downPaymentCents: Long) {
        val parts = partsText.trim().toIntOrNull() ?: return
        val plan = CreditPlan.buildEvenPlan(dueTotalCents - downPaymentCents, parts, firstDue, frequency)
        if (plan.isEmpty()) return
        rows.clear()
        plan.forEach { (due, cents) -> rows.add(InstalmentRow(nextId++, due, CreditPlan.fromCents(cents).toPlainString())) }
    }

    fun setAmount(id: Int, amount: String) = replace(id) { it.copy(amount = amount) }
    fun setDue(id: Int, dueDate: String) = replace(id) { it.copy(dueDate = dueDate) }
    fun add() { rows.add(InstalmentRow(nextId++, firstDue, "")) }
    fun remove(id: Int) { rows.removeAll { it.id == id } }

    private fun replace(id: Int, f: (InstalmentRow) -> InstalmentRow) {
        val i = rows.indexOfFirst { it.id == id }
        if (i >= 0) rows[i] = f(rows[i])
    }

    /** cart total − down payment − Σ instalments, in cents (0 = balanced). */
    fun remainingCents(downPaymentCents: Long): Long =
        CreditPlan.planRemainingCents(dueTotalCents, downPaymentCents, rows.map { CreditPlan.toCents(it.amount) })

    fun hasPastDue(): Boolean = rows.any { CreditPlan.isPastDue(it.dueDate) }
    fun hasZeroPart(): Boolean = rows.any { CreditPlan.toCents(it.amount) <= 0 }

    fun planValid(downPaymentCents: Long): Boolean =
        rows.isNotEmpty() && remainingCents(downPaymentCents) == 0L && !hasPastDue() && !hasZeroPart()

    fun planParts(): List<PlanPart> = rows.map { PlanPart(it.dueDate, CreditPlan.toCents(it.amount)) }

    private companion object {
        fun defaultFirstDue(): String = LocalDate.now(ZoneOffset.UTC).plusMonths(1).format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE)
    }
}
