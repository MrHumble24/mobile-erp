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
data class ExpenseProfileRef(val firstName: String? = null, val lastName: String? = null)

@Serializable
data class ExpenseUserRef(
    val email: String = "",
    val profile: ExpenseProfileRef? = null,
) {
    /** Full name when a profile exists, else the email. */
    val displayName: String
        get() = profile?.let { listOfNotNull(it.firstName, it.lastName).joinToString(" ").trim() }
            ?.ifBlank { email } ?: email
}

@Serializable
data class Expense(
    val id: String,
    val categoryId: String,
    val category: ExpenseCategoryRef? = null,
    @Serializable(with = FlexMoneySerializer::class) val amount: String = "0",
    val description: String? = null,
    val vendor: String? = null,
    val isRecurring: Boolean = false,
    val incurredAt: String? = null,
    val createdAt: String? = null,
    val createdBy: ExpenseUserRef? = null,
    /** Account the money left from; optional so older cached rows still decode. */
    val accountCode: String? = null,
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

/** Create / update body for `/expenses` (online-only write). */
@Serializable
data class CreateExpenseBody(
    val categoryId: String,
    val amount: Double,
    val description: String? = null,
    val vendor: String? = null,
    val isRecurring: Boolean = false,
    val incurredAt: String? = null,
    val accountCode: String? = null,
)

/** Create body for `POST /expense-categories` (online-only write). */
@Serializable
data class CreateCategoryBody(val name: String)

/** Sort options for the expenses list (`sort:dir`), mirroring the web page. */
enum class ExpenseSort(val field: String, val dir: String) {
    NEWEST("incurredAt", "desc"),
    OLDEST("incurredAt", "asc"),
    AMOUNT_DESC("amount", "desc"),
    AMOUNT_ASC("amount", "asc"),
}

/**
 * The expenses-list filter: client state and the query it maps to. Mirrors the
 * web `useExpenseFilters` surface (search, amount bounds, sort, date range).
 */
data class ExpenseFilter(
    val categoryId: String? = null,
    val isRecurring: Boolean? = null,
    val search: String? = null,
    val minAmount: Double? = null,
    val maxAmount: Double? = null,
    val fromIso: String? = null,
    val toIso: String? = null,
    val sort: ExpenseSort = ExpenseSort.NEWEST,
)
