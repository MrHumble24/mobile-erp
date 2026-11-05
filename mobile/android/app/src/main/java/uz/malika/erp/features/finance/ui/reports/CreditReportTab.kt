package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import uz.malika.erp.AppContainer
import uz.malika.erp.features.credit.data.CreditApi
import uz.malika.erp.features.credit.data.CreditRepository
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Customer-credit report (perm `report.finance`, ADR 0035): total left to pay,
 * total overdue, and the debt per customer. Self-fetches from the credit slice;
 * no interest/fee is ever part of these figures.
 */
@Composable
fun CreditReportTab(container: AppContainer) {
    val t = LocalT.current
    val repo = remember { CreditRepository(container.retrofit.create(CreditApi::class.java)) }
    val report = rememberAsync { repo.report() }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = Tokens.Space.lg),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        Spacer(Modifier.height(Tokens.Space.xs))
        AsyncContent(report, retryLabel = t("common.retry", null)) { r ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                MetricTile(t("credit.totalOutstanding", null), r.totalOutstanding, Modifier.weight(1f))
                MetricTile(t("credit.totalOverdue", null), r.totalOverdue, Modifier.weight(1f))
            }
            if (r.customers.isEmpty()) {
                AppCard(Modifier.fillMaxWidth()) { EmptyView(t("credit.noCredits", null), compact = true) }
            } else {
                AppCard(Modifier.fillMaxWidth()) {
                    r.customers.forEach { c ->
                        Row(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.rowV), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(c.name, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                                c.phone?.let { Text(it, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted) }
                            }
                            Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                                MoneyText(c.outstanding, style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text))
                                if (parseMoney(c.overdueAmount).signum() > 0) {
                                    MoneyText(c.overdueAmount, style = MaterialTheme.typography.labelSmall.copy(color = Tokens.danger))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
