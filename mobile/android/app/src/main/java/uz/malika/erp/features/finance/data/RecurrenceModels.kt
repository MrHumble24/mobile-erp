package uz.malika.erp.features.finance.data

import kotlinx.serialization.Serializable

/**
 * Recurring-expense template shapes for `/expense-recurrences` and the
 * category-update body for `/expense-categories/{id}`. All writes are
 * online-only (not in the offline outbox).
 */
@Serializable
data class ExpenseRecurrence(
    val id: String,
    val categoryId: String,
    val category: ExpenseCategoryRef? = null,
    @Serializable(with = FlexMoneySerializer::class) val amount: String = "0",
    val description: String? = null,
    val vendor: String? = null,
    val frequency: String = "monthly",
    val nextDueAt: String = "",
    val isActive: Boolean = true,
    /** Account the money leaves from; optional so older cached rows still decode. */
    val accountCode: String? = null,
) {
    val categoryName: String get() = category?.name ?: ""
}

/** Create body for `POST /expense-recurrences`. */
@Serializable
data class CreateRecurrenceBody(
    val categoryId: String,
    val amount: Double,
    val description: String? = null,
    val vendor: String? = null,
    val frequency: String,
    val nextDueAt: String,
    val accountCode: String? = null,
)

/**
 * Patch body for `PATCH /expense-recurrences/{id}`. Only non-null fields are
 * sent (the HTTP client drops nulls), so a lone `isActive` toggles activation.
 */
@Serializable
data class UpdateRecurrenceBody(
    val categoryId: String? = null,
    val amount: Double? = null,
    val description: String? = null,
    val vendor: String? = null,
    val frequency: String? = null,
    val nextDueAt: String? = null,
    val isActive: Boolean? = null,
    val accountCode: String? = null,
)

/** Result of `POST /expense-recurrences/generate`. */
@Serializable
data class GenerateResult(val generated: Int = 0)

/**
 * Patch body for `PATCH /expense-categories/{id}`. [reassignToId] moves this
 * category's expenses to another before deactivating (server returns 409 if a
 * category in use is deactivated without it).
 */
@Serializable
data class UpdateCategoryBody(
    val name: String? = null,
    val description: String? = null,
    val sortOrder: Int? = null,
    val isActive: Boolean? = null,
    val reassignToId: String? = null,
)
