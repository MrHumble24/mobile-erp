package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.CreateRecurrenceBody
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseRecurrence
import uz.malika.erp.features.finance.model.RecurrencesViewModel
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.DateField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private fun parseDay(iso: String): Date =
    iso.take(10).let { runCatching { SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(it) }.getOrNull() } ?: Date()

/** Online-only recurring-template form — create or edit. */
@Composable
fun RecurrenceSheet(
    vm: RecurrencesViewModel,
    categories: List<ExpenseCategory>,
    editing: ExpenseRecurrence?,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var categoryId by remember { mutableStateOf(editing?.categoryId) }
    var amount by remember { mutableStateOf(editing?.amount?.takeIf { it != "0" } ?: "") }
    var description by remember { mutableStateOf(editing?.description ?: "") }
    var vendor by remember { mutableStateOf(editing?.vendor ?: "") }
    var frequency by remember { mutableStateOf(editing?.frequency ?: "monthly") }
    var nextDue by remember { mutableStateOf(editing?.nextDueAt?.let(::parseDay) ?: Date()) }
    var amountError by remember { mutableStateOf<String?>(null) }
    var categoryError by remember { mutableStateOf(false) }

    fun submit() {
        val amt = amount.trim().toDoubleOrNull()
        categoryError = categoryId == null
        amountError = if (amt == null || amt <= 0) t("expenses.amountPositive", null) else null
        if (categoryError || amountError != null) return
        vm.save(
            editing?.id,
            CreateRecurrenceBody(
                categoryId = categoryId!!,
                amount = amt!!,
                description = description.trim().ifBlank { null },
                vendor = vendor.trim().ifBlank { null },
                frequency = frequency,
                nextDueAt = isoDate(nextDue),
            ),
            onSuccess = onDismiss,
        )
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                t(if (editing == null) "expenses.newRecurrence" else "expenses.editRecurrence", null),
                style = MaterialTheme.typography.headlineSmall,
            )
            AppSelectField(
                label = t("expenses.category", null),
                options = categories.map { SelectOption<String?>(it.id, it.name) },
                selected = categoryId,
                onSelect = { categoryId = it; categoryError = false },
            )
            if (categoryError) {
                Text(t("expenses.categoryRequired", null), style = MaterialTheme.typography.bodySmall, color = Tokens.destructive)
            }
            AppFormField(
                label = t("expenses.amount", null),
                value = amount,
                onValueChange = { amount = it; amountError = null },
                keyboardType = KeyboardType.Decimal,
                error = amountError,
            )
            AppFormField(label = t("expenses.vendor", null), value = vendor, onValueChange = { vendor = it })
            AppFormField(label = t("expenses.description", null), value = description, onValueChange = { description = it })
            Column {
                Text(t("expenses.frequency", null), style = MaterialTheme.typography.labelLarge)
                Spacer(Modifier.height(6.dp))
                SegmentedControl(
                    options = listOf(
                        SegmentOption("monthly", t("expenses.frequencyMonthly", null)),
                        SegmentOption("weekly", t("expenses.frequencyWeekly", null)),
                    ),
                    selected = frequency,
                    onSelect = { frequency = it },
                )
            }
            DateField(t("expenses.nextDueAt", null), nextDue, onChanged = { nextDue = it })
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End)) {
                PillButton(t("common.cancel", null), onClick = onDismiss, variant = ButtonVariant.OUTLINE)
                PillButton(t("common.save", null), onClick = ::submit)
            }
        }
    }
}
