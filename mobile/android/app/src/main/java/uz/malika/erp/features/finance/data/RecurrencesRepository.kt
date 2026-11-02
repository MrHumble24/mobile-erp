package uz.malika.erp.features.finance.data

import uz.malika.erp.core.runApi

/**
 * The only place this slice talks to `/expense-recurrences`. All writes are
 * online-only. `generate` spawns real expenses for every template whose next
 * due date has passed and returns how many were created.
 */
class RecurrencesRepository(private val api: FinanceApi) {

    suspend fun list(): List<ExpenseRecurrence> = runApi { api.recurrences() }

    suspend fun create(body: CreateRecurrenceBody) = runApi {
        api.createRecurrence(body)
        Unit
    }

    suspend fun update(id: String, body: UpdateRecurrenceBody) = runApi {
        api.updateRecurrence(id, body)
        Unit
    }

    suspend fun generateDue(): Int = runApi { api.generateRecurrences().generated }
}
