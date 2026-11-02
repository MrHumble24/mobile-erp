package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import java.math.BigDecimal

/**
 * Checkout form: sale price (prefilled from the target price), an optional
 * customer (existing or new), warranty days (prefilled from settings), and
 * notes. Submitting enqueues the sale through [PosViewModel.checkout].
 */
@Composable
fun PosCheckoutForm(
    vm: PosViewModel,
    state: PosState,
    online: Boolean,
    container: AppContainer,
    api: SalesApi,
) {
    val t = LocalT.current
    val device = state.device ?: return
    val busy = state.busy

    var price by remember(device.id) { mutableStateOf(device.targetPrice ?: "") }
    var warranty by remember(device.id) { mutableStateOf("") }
    var notes by remember(device.id) { mutableStateOf("") }
    var priceError by remember(device.id) { mutableStateOf<String?>(null) }
    var customer by remember(device.id) { mutableStateOf(CustomerSelection()) }

    // Prefill warranty once the store default arrives.
    LaunchedEffect(state.defaultWarrantyDays) {
        if (warranty.isBlank() && state.defaultWarrantyDays != null) {
            warranty = state.defaultWarrantyDays.toString()
        }
    }

    val lookupRepo = remember { CustomersRepository(api) }

    Column(Modifier.fillMaxWidth()) {
        AppFormField(
            label = t("pos.salePrice", null),
            value = price,
            onValueChange = { price = it; priceError = null },
            keyboardType = KeyboardType.Decimal,
            error = priceError,
        )
        Spacer(Modifier.height(12.dp))
        AppFormField(
            label = t("pos.warrantyDays", null),
            value = warranty,
            onValueChange = { warranty = it },
            keyboardType = KeyboardType.Number,
        )
        Spacer(Modifier.height(12.dp))
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
        )
        Spacer(Modifier.height(20.dp))
        PillButton(
            text = if (busy) t("pos.completingSale", null) else t("pos.checkoutButton", null),
            onClick = {
                if (parseMoney(price) <= BigDecimal.ZERO) {
                    priceError = t("common.required", null)
                    return@PillButton
                }
                vm.checkout(
                    salePrice = price.trim(),
                    online = online,
                    customerId = customer.customerId,
                    customerName = customer.newName,
                    customerPhone = customer.newPhone,
                    warrantyDays = warranty.trim().toIntOrNull(),
                    notes = notes.trim(),
                )
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !busy,
        )
    }
}
