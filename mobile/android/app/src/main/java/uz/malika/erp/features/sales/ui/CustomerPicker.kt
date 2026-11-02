package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import uz.malika.erp.features.sales.data.Customer
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton

/** The optional customer attached to a checkout: a picked existing one, or a new inline one. */
data class CustomerSelection(
    val customerId: String? = null,
    val newName: String? = null,
    val newPhone: String? = null,
)

/**
 * Optional customer selector for POS checkout: search an existing customer
 * (`/customers/lookup`) or add a new one inline. Mirrors the web CustomerPanel.
 * Lookup runs online; with no connection the search simply returns nothing and
 * the cashier adds a new customer or sells walk-in.
 */
@Composable
fun CustomerPicker(
    selection: CustomerSelection,
    onChange: (CustomerSelection) -> Unit,
    lookup: suspend (String) -> List<Customer>,
    enabled: Boolean,
) {
    val t = LocalT.current
    var picked by remember { mutableStateOf<Customer?>(null) }
    var addNew by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<Customer>>(emptyList()) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }

    LaunchedEffect(picked, addNew, name, phone) {
        onChange(
            when {
                picked != null -> CustomerSelection(customerId = picked!!.id)
                addNew -> CustomerSelection(newName = name, newPhone = phone)
                else -> CustomerSelection()
            },
        )
    }

    // Typeahead: debounce keystrokes, then search existing customers.
    LaunchedEffect(query) {
        if (query.isBlank()) {
            results = emptyList()
        } else {
            delay(300)
            results = runCatching { lookup(query) }.getOrDefault(emptyList())
        }
    }

    Column(Modifier.fillMaxWidth()) {
        Text(t("pos.customer", null), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(6.dp))
        when {
            picked != null -> AppCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth()) {
                    Column(Modifier.weight(1f)) {
                        Text(picked!!.name, style = MaterialTheme.typography.titleSmall)
                        picked!!.phone?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                    }
                    PillButton(t("common.cancel", null), { picked = null }, variant = ButtonVariant.GHOST, enabled = enabled)
                }
            }

            addNew -> {
                AppFormField(t("pos.customerName", null), name, { name = it }, enabled = enabled)
                Spacer(Modifier.height(8.dp))
                AppFormField(t("pos.customerPhone", null), phone, { phone = it }, enabled = enabled, keyboardType = KeyboardType.Phone)
                Spacer(Modifier.height(8.dp))
                PillButton(t("common.cancel", null), { addNew = false; name = ""; phone = "" }, variant = ButtonVariant.GHOST, enabled = enabled)
            }

            else -> {
                AppTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = t("pos.searchCustomer", null),
                    enabled = enabled,
                    imeAction = ImeAction.Search,
                )
                results.take(6).forEach { c ->
                    Spacer(Modifier.height(6.dp))
                    AppCard(Modifier.fillMaxWidth(), onClick = { picked = c; results = emptyList() }) {
                        Text(c.name, style = MaterialTheme.typography.titleSmall)
                        c.phone?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                    }
                }
                Spacer(Modifier.height(8.dp))
                PillButton(t("pos.newCustomer", null), { addNew = true }, variant = ButtonVariant.OUTLINE, enabled = enabled)
            }
        }
    }
}
