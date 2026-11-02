package uz.malika.erp.features.finance.data

import kotlinx.serialization.Serializable

/**
 * Expense + category shapes for `/expenses` and `/expense-categories`. Money
 * (`amount`, `total`) is a decimal string via [FlexMoneySerializer]. These
 * serializable shapes double as the slice's domain types — the DTO→domain map
 * would be the identity, so it is skipped.
 */
@Serializable
data class ExpenseCategory(
    val id: String,
    val name: String,
    val description: String? = null,
    val sortOrder: Int = 0,
    val isActive: Boolean = true,
)

@Serializable
data class ExpenseCategoryRef(val name: String = "")

@Serializable
data class Expense(
    val id: String,
    val categoryId: String,
    val category: ExpenseCategoryRef? = null,
    @Serializable(with = FlexMoneySerializer::class) val amount: String = "0",
    val description: String? = null,
    val isRecurring: Boolean = false,
    val incurredAt: String? = null,
) {
    val categoryName: String get() = category?.name ?: ""
}

@Serializable
data class ExpensePage(
    val items: List<Expense> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class ExpenseSummaryRow(
    val categoryId: String = "",
    val name: String = "",
    @Serializable(with = FlexMoneySerializer::class) val total: String = "0",
)

@Serializable
data class ExpenseSummary(
    @Serializable(with = FlexMoneySerializer::class) val total: String = "0",
    val byCategory: List<ExpenseSummaryRow> = emptyList(),
)

/** Create body for `POST /expenses` (online-only write). */
@Serializable
data class CreateExpenseBody(
    val categoryId: String,
    val amount: Double,
    val description: String? = null,
    val isRecurring: Boolean = false,
    val incurredAt: String? = null,
)

/** Create body for `POST /expense-categories` (online-only write). */
@Serializable
data class CreateCategoryBody(val name: String)

/** The expenses-list filter: client state and the query it maps to. */
data class ExpenseFilter(
    val categoryId: String? = null,
    val isRecurring: Boolean? = null,
)
