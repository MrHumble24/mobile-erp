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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import uz.malika.erp.AppContainer
import uz.malika.erp.features.customs.data.CustomsApi
import uz.malika.erp.features.customs.data.CustomsRepository
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BarChart
import uz.malika.erp.features.finance.ui.components.BarDatum
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Customs fees over time (perm `report.finance`): pick a customs code, see its
 * fee across every price-list version as a [BarChart] (one bar per effective
 * date) with the raw numbers listed below. Codes and history come from the
 * customs slice's repository — no money series to compute here.
 */
@Composable
fun CustomsFeesTab(container: AppContainer) {
    val t = LocalT.current
    val repo = remember { CustomsRepository(container.retrofit.create(CustomsApi::class.java)) }
    val current = rememberAsync { repo.current() }
    var code by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = Tokens.Space.lg),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        Spacer(Modifier.height(Tokens.Space.xs))
        AsyncContent(current, retryLabel = t("common.retry", null)) { list ->
            val codes = list?.items?.map { it.customsCode }.orEmpty()
            AppSelect(
                label = t("customs.pickCode", null),
                value = code,
                options = codes,
                optionLabel = { it },
                onSelect = { code = it },
                placeholder = t("customs.pickCode", null),
            )
        }
        code?.let { FeeHistory(repo, it) }
    }
}

@Composable
private fun FeeHistory(repo: CustomsRepository, code: String) {
    val t = LocalT.current
    val handle = rememberAsync(code) { repo.feeHistory(code) }
    AsyncContent(handle, retryLabel = t("common.retry", null)) { points ->
        if (points.isEmpty()) {
            AppCard(Modifier.fillMaxWidth()) { EmptyView(t("customs.historyEmpty", null), compact = true) }
            return@AsyncContent
        }
        BarChart(
            title = t("reports.customsTab", null),
            data = points.map { BarDatum(it.effectiveAt.take(10), parseMoney(it.fee).toDouble()) },
        )
        AppCard(Modifier.fillMaxWidth()) {
            points.forEach { p ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        p.effectiveAt.take(10),
                        style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                        color = Tokens.muted,
                    )
                    MoneyText(p.fee, style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(Modifier.height(Tokens.Space.rowV))
            }
        }
    }
}
