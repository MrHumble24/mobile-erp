package uz.malika.erp.features.finance.data

import uz.malika.erp.core.AppException
import uz.malika.erp.core.runApi
import uz.malika.erp.shared.lib.DEFAULT_PAGE_SIZE

/**
 * The only place this slice talks to `/expenses` and `/expense-categories`.
 * All writes are online-only (no outbox) — callers gate on connectivity first.
 * Returns normalized [AppException] on failure via `runApi`.
 */
class ExpensesRepository(private val api: FinanceApi) {

    suspend fun list(filter: ExpenseFilter, page: Int): ExpensePage = runApi {
        api.expenses(
            categoryId = filter.categoryId,
            isRecurring = filter.isRecurring,
            search = filter.search?.ifBlank { null },
            minAmount = filter.minAmount,
            maxAmount = filter.maxAmount,
            from = filter.fromIso,
            to = filter.toIso,
            sort = filter.sort.field,
            dir = filter.sort.dir,
            page = page,
            pageSize = DEFAULT_PAGE_SIZE,
        )
    }

    suspend fun summary(filter: ExpenseFilter): ExpenseSummary =
        runApi { api.expenseSummary(filter.fromIso, filter.toIso) }

    suspend fun categories(): List<ExpenseCategory> = runApi { api.expenseCategories() }

    suspend fun create(body: CreateExpenseBody) = runApi {
        api.createExpense(body)
        Unit
    }

    suspend fun update(id: String, body: CreateExpenseBody) = runApi {
        api.updateExpense(id, body)
        Unit
    }

    suspend fun addCategory(name: String) = runApi {
        api.createCategory(CreateCategoryBody(name))
        Unit
    }

    suspend fun updateCategory(id: String, body: UpdateCategoryBody) = runApi {
        api.updateCategory(id, body)
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
