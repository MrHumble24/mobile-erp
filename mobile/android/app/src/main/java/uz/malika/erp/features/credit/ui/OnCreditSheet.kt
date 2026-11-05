package uz.malika.erp.features.credit.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.credit.data.CreditApi
import uz.malika.erp.features.credit.data.CreditCreate
import uz.malika.erp.features.credit.data.CreditRepository
import uz.malika.erp.features.credit.lib.CreditPlan
import uz.malika.erp.features.credit.model.CreateCreditViewModel
import uz.malika.erp.features.credit.model.CreditDraft
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.lib.PricedCart
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.ui.PaymentMethodField
import uz.malika.erp.shared.payments.ui.PaymentSelection
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens
import java.util.UUID

/**
 * The "On credit" till sheet (ADR 0035): the chosen customer's debt + limit, the
 * cart total, a down payment, the payment plan, and the submit. Online only — the
 * caller only opens it online. A successful sale shows the result. Credit needs an
 * existing customer with a phone; otherwise it shows the needs-customer message.
 */
@Composable
fun OnCreditSheet(
    container: AppContainer,
    priced: PricedCart,
    level: String,
    customerId: String?,
    onSold: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val repo = remember { CreditRepository(container.retrofit.create(CreditApi::class.java)) }
    val customersRepo = remember { CustomersRepository(container.retrofit.create(SalesApi::class.java)) }
    val vm: CreateCreditViewModel = viewModel(factory = viewModelFactory { initializer { CreateCreditViewModel(repo) } })
    val state by vm.state.collectAsState()

    // Clear the till cart the moment the credit is sold (the result view stays up).
    androidx.compose.runtime.LaunchedEffect(state.result?.id) { if (state.result != null) onSold() }

    val customer by produceState<uz.malika.erp.features.sales.data.CustomerListItem?>(null, customerId) {
        value = customerId?.let { runCatching { customersRepo.get(it) }.getOrNull() }
    }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter), verticalArrangement = Arrangement.spacedBy(Tokens.Space.md)) {
        Text(t("credit.payOnCredit", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)

        state.result?.let { credit ->
            Text(t("credit.created", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.success)
            CreditFacts(credit.agreedTotal, credit.paid, credit.outstanding, credit.overdueAmount, credit.overpaid)
            PillButton(t("common.close", null), { vm.reset(); onDismiss() }, Modifier.fillMaxWidth())
            return@Column
        }

        val c = customer
        if (customerId == null || c?.phone.isNullOrBlank()) {
            Text(t("credit.needsCustomer", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
            return@Column
        }

        CreditForm(container, priced, level, c!!, vm, state)
    }
}

@Composable
private fun CreditForm(
    container: AppContainer,
    priced: PricedCart,
    level: String,
    customer: uz.malika.erp.features.sales.data.CustomerListItem,
    vm: CreateCreditViewModel,
    state: uz.malika.erp.features.credit.model.CreateCreditState,
) {
    val t = LocalT.current
    val dueTotal = priced.totals.payable
    val dueTotalCents = CreditPlan.toCents(dueTotal)
    val draft = remember(dueTotalCents) { CreditDraft(dueTotalCents) }
    val accounts by rememberAccountOptions(container)
    val clientKey = remember { UUID.randomUUID().toString() }

    var downText by remember { mutableStateOf("") }
    var payment by remember { mutableStateOf(PaymentSelection()) }
    val downAmount = parseMoney(downText)
    val downCents = CreditPlan.toCents(downText)

    val effLimitCents = customer.effectiveCreditLimit?.let { CreditPlan.toCents(it) }
    val overLimit = CreditPlan.wouldExceedLimit(CreditPlan.toCents(customer.creditOutstanding), dueTotalCents - downCents, effLimitCents)
    val downValid = downAmount.signum() == 0 || payment.valid(downAmount, accounts)
    val planValid = draft.planValid(downCents)
    val busy = state.submitting

    // Buyer's current debt + the limit in use.
    AppCard(Modifier.fillMaxWidth()) {
        FactRow(t("credit.currentDebt", null)) { MoneyText(customer.creditOutstanding, style = mono()) }
        FactRow(t("credit.effectiveLimit", null), last = true) {
            Text(customer.effectiveCreditLimit?.let { uz.malika.erp.shared.lib.formatMoney(it) } ?: t("credit.noLimit", null), style = mono())
        }
    }
    if (overLimit) Text(t("credit.errorLimit", null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger)

    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(t("pos.totalDue", null), style = MaterialTheme.typography.titleSmall, color = Tokens.text)
        MoneyText(dueTotal.toPlainString(), style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily, color = Tokens.text))
    }

    AppFormField(t("credit.downPayment", null), downText, { downText = it }, keyboardType = KeyboardType.Decimal, enabled = !busy)
    if (downAmount.signum() > 0) {
        PaymentMethodField(selection = payment, onSelection = { payment = it }, accounts = accounts, total = downAmount, enabled = !busy)
    }

    CreditPlanBuilder(draft, downCents, enabled = !busy)

    state.errorKey?.let { Text(t(it, null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
    state.errorText?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
    if (state.needsShift) Text(t("shifts.shiftRequired", null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger)

    PillButton(
        text = if (busy) t("common.loading", null) else t("credit.sellButton", null),
        onClick = {
            val down = payment.parts(downAmount, accounts).takeIf { downAmount.signum() > 0 }.orEmpty()
            vm.submit(CreditCreate.body(priced.lines, level, customer.id, down, draft.planParts(), null, clientKey))
        },
        enabled = !busy && planValid && downValid && !overLimit && priced.lines.isNotEmpty(),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun mono() = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)
