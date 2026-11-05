package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.data.totalPrice
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.ui.PaymentMethodField
import uz.malika.erp.shared.payments.ui.PaymentSelection
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import java.math.BigDecimal

/**
 * Cart-level checkout: an optional customer (existing via typeahead, or new
 * inline), shared notes, the running total, and the submit button. Submitting
 * fans the cart into one `sale.create` per device via [PosViewModel.checkout].
 */
@Composable
fun PosCheckoutForm(
    container: AppContainer,
    vm: PosViewModel,
    state: PosState,
    online: Boolean,
    api: SalesApi,
) {
    val t = LocalT.current
    val busy = state.busy

    var notes by remember { mutableStateOf("") }
    var customer by remember { mutableStateOf(CustomerSelection()) }
    var payment by remember { mutableStateOf(PaymentSelection()) }
    val lookupRepo = remember { CustomersRepository(api) }
    val accounts by rememberAccountOptions(container)

    val total = parseMoney(state.lines.totalPrice())
    val pricesValid = state.lines.isNotEmpty() &&
        state.lines.all { it.lineTotal > BigDecimal.ZERO }
    val payValid = payment.valid(total, accounts)

    Column(Modifier.fillMaxWidth()) {
        CustomerPicker(
            selection = customer,
            onChange = { customer = it },
            lookup = { lookupRepo.lookup(it) },
            enabled = !busy,
        )
        Spacer(Modifier.height(12.dp))
        AppFormField(
            label = t("pos.notes", null),
            value = notes,
            onValueChange = { notes = it },
            enabled = !busy,
        )
        Spacer(Modifier.height(16.dp))
        PaymentMethodField(
            selection = payment,
            onSelection = { payment = it },
            accounts = accounts,
            total = total,
            enabled = !busy,
        )
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth()) {
            Text(t("pos.totalDue", null), style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
            Text(
                formatMoney(state.lines.totalPrice()),
                style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily, fontWeight = FontWeight.Bold),
            )
        }
        Spacer(Modifier.height(16.dp))
        PillButton(
            text = if (busy) t("pos.completingSale", null) else t("pos.checkoutButton", null),
            onClick = {
                vm.checkout(
                    online = online,
                    customerId = customer.customerId,
                    customerName = customer.newName,
                    customerPhone = customer.newPhone,
                    notes = notes.trim(),
                    parts = payment.parts(total, accounts),
                )
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !busy && pricesValid && payValid,
        )
    }
}
