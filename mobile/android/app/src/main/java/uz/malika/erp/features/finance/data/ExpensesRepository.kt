package uz.malika.erp.features.finance.data

import uz.malika.erp.core.AppException
import uz.malika.erp.core.runApi

/**
 * The only place this slice talks to `/expenses` and `/expense-categories`.
 * All writes are online-only (no outbox) — callers gate on connectivity first.
 * Returns normalized [AppException] on failure via `runApi`.
 */
class ExpensesRepository(private val api: FinanceApi) {

    suspend fun list(filter: ExpenseFilter): ExpensePage = runApi {
        api.expenses(filter.categoryId, filter.isRecurring, page = 1, pageSize = 100)
    }

    suspend fun summary(): ExpenseSummary = runApi { api.expenseSummary(from = null, to = null) }

    suspend fun categories(): List<ExpenseCategory> = runApi { api.expenseCategories() }

    suspend fun create(
        categoryId: String,
        amount: Double,
        description: String?,
        isRecurring: Boolean,
        incurredAt: String?,
    ) = runApi {
        api.createExpense(
            CreateExpenseBody(
                categoryId = categoryId,
                amount = amount,
                description = description?.ifBlank { null },
                isRecurring = isRecurring,
                incurredAt = incurredAt,
            ),
        )
        Unit
    }

    suspend fun addCategory(name: String) = runApi {
        api.createCategory(CreateCategoryBody(name))
        Unit
    }

    suspend fun remove(id: String) = runApi {
        val res = api.deleteExpense(id)
        if (!res.isSuccessful) {
            throw AppException.parse(res.code(), res.errorBody()?.string())
                ?: AppException(res.code(), "Delete failed")
        }
    }
}
