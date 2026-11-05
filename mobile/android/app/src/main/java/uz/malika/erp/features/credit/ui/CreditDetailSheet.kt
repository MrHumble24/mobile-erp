package uz.malika.erp.features.credit.ui

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
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.credit.data.CreditApi
import uz.malika.erp.features.credit.data.CreditInstalmentView
import uz.malika.erp.features.credit.data.CreditPaymentView
import uz.malika.erp.features.credit.data.CreditRepository
import uz.malika.erp.features.credit.data.CreditSaleView
import uz.malika.erp.features.credit.model.CreditDetailViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One credit agreement (ADR 0035): facts, goods, plan, payments, and actions. */
@Composable
fun CreditDetailSheet(container: AppContainer, creditId: String, onChanged: () -> Unit) {
    val t = LocalT.current
    val repo = remember { CreditRepository(container.retrofit.create(CreditApi::class.java)) }
    val vm: CreditDetailViewModel = viewModel(
        key = "credit-$creditId",
        factory = viewModelFactory { initializer { CreditDetailViewModel(repo, creditId) } },
    )
    val state by vm.state.collectAsState()
    val canRefund = LocalCan.current("sale.return")
    var paying by remember { mutableStateOf(false) }
    var refunding by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        when {
            state.loading -> Loading()
            state.credit == null -> ErrorView(state.error ?: t("common.error", null), retryLabel = t("common.retry", null), onRetry = vm::load)
            else -> {
                val c = state.credit!!
                Text(c.customer.name, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
                c.customer.phone?.let { Text(it, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.muted) }
                Spacer(Modifier.height(Tokens.Space.lg))
                CreditFacts(c.agreedTotal, c.paid, c.outstanding, c.overdueAmount, c.overpaid)

                Section(t("credit.goods", null)) { c.sales.forEach { GoodsRow(it) } }
                Section(t("credit.plan", null)) { c.instalments.forEachIndexed { i, it -> InstalmentRowView(i + 1, it) } }
                if (c.payments.isNotEmpty()) Section(t("credit.payments", null)) { c.payments.forEach { PaymentRowView(it) } }

                Spacer(Modifier.height(Tokens.Space.lg))
                if (!c.settled && parseMoney(c.outstanding).signum() > 0) {
                    PillButton(t("credit.takePayment", null), { paying = true }, Modifier.fillMaxWidth())
                }
                if (canRefund && parseMoney(c.overpaid).signum() > 0) {
                    Spacer(Modifier.height(Tokens.Space.sm))
                    PillButton(t("credit.refundOverpayment", null), { refunding = true }, Modifier.fillMaxWidth(), variant = uz.malika.erp.shared.ui.ButtonVariant.OUTLINE)
                }
                Spacer(Modifier.height(Tokens.Space.sm))
            }
        }
    }

    val c = state.credit
    if (paying && c != null) {
        CreditPaymentSheet(
            container, t("credit.takePayment", null), c.outstanding, state.submitting, state.actionError,
            onSubmit = { amount, account -> vm.takePayment(amount, account) { paying = false; onChanged() } },
            onDismiss = { paying = false; vm.clearActionError() },
        )
    }
    if (refunding && c != null) {
        CreditPaymentSheet(
            container, t("credit.refundOverpayment", null), c.overpaid, state.submitting, state.actionError,
            onSubmit = { amount, account -> vm.refund(amount, account) { refunding = false; onChanged() } },
            onDismiss = { refunding = false; vm.clearActionError() },
        )
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Spacer(Modifier.height(Tokens.Space.lg))
    Text(title, style = MaterialTheme.typography.titleMedium, color = Tokens.text)
    Spacer(Modifier.height(Tokens.Space.sm))
    content()
}

@Composable
private fun GoodsRow(sale: CreditSaleView) {
    val t = LocalT.current
    Row(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.xs), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(sale.model, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            val code = UnitCode.display(sale.imei, sale.serialNumber)
            if (code.isNotBlank()) Text(code, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
            if (sale.returnedAt != null) StatusChip(t("sales.returned", null), color = Tokens.warning)
        }
        MoneyText(sale.salePrice, style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text))
    }
}

@Composable
private fun InstalmentRowView(n: Int, row: CreditInstalmentView) {
    val t = LocalT.current
    val fullyPaid = parseMoney(row.paid) >= parseMoney(row.amount)
    Row(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.xs), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(t("credit.instalment", mapOf("n" to n)), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            Text(formatDate(row.dueDate), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            when {
                row.overdue -> StatusChip(t("credit.overdue", null), color = Tokens.danger)
                fullyPaid -> StatusChip(t("credit.paid", null), color = Tokens.success)
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            MoneyText(row.amount, style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text))
            if (parseMoney(row.paid).signum() > 0 && !fullyPaid) {
                Text("${t("credit.paid", null)}: ${uz.malika.erp.shared.lib.formatMoney(row.paid)}", style = MaterialTheme.typography.labelSmall, color = Tokens.muted)
            }
        }
    }
}

@Composable
private fun PaymentRowView(p: CreditPaymentView) {
    Row(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.xs), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(formatDate(p.occurredAt), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            Text(p.receivedBy.name, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }
        MoneyText(p.amount, style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text))
    }
}
