package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.finance.data.ReturnRow
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.DEFAULT_PAGE_SIZE
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Paginated refunded-returns list (`/reports/returns`) — the Compose analogue of
 * the web `ReturnsListBreakdown`, opened from the Overview returns tile. Loads
 * page 1 on open and appends via [LoadMoreFooter] (`PageState` + load-more).
 */
@Composable
fun ReturnsBreakdownSheet(
    vm: FinanceReadsViewModel,
    fromIso: String?,
    toIso: String?,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var page by remember { mutableStateOf(PageState<ReturnRow>()) }
    var error by remember { mutableStateOf<String?>(null) }

    fun load(next: Int) {
        if (page.loading) return
        page = page.copy(loading = true)
        error = null
        scope.launch {
            try {
                val resp = vm.returns(fromIso, toIso, next, DEFAULT_PAGE_SIZE)
                page = page.append(resp.items, resp.total, next)
            } catch (e: AppException) {
                error = e.message
                page = page.copy(loading = false)
            }
        }
    }

    LaunchedEffect(fromIso, toIso) { page = PageState(); load(1) }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(t("reports.brkReturns", null), style = MaterialTheme.typography.headlineSmall)
            val items = page.items
            when {
                page.loading && items.isEmpty() -> Box(
                    Modifier.fillMaxWidth().height(160.dp),
                    contentAlignment = Alignment.Center,
                ) { CircularProgressIndicator(color = Tokens.primary) }

                error != null && items.isEmpty() ->
                    ErrorView(error!!, retryLabel = t("common.retry", null), onRetry = { load(1) })

                items.isEmpty() -> EmptyView(t("reports.empty", null))

                else -> LazyColumn(
                    Modifier.fillMaxWidth().heightIn(max = 480.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(items) { row -> ReturnRowView(row) }
                    item { LoadMoreFooter(page.hasMore, page.loading, { load(page.nextPage) }) }
                }
            }
        }
    }
}

@Composable
private fun ReturnRowView(row: ReturnRow) {
    val t = LocalT.current
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Column(Modifier.weight(1f).padding(end = 8.dp)) {
            Text(row.model, style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(
                row.imei,
                style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                color = Tokens.mutedForeground,
            )
            if (!row.reason.isNullOrBlank()) {
                Text(row.reason, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            MoneyText(row.refundAmount, style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.danger))
            Spacer(Modifier.height(2.dp))
            Text(row.returnedAt.take(10), style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
        }
    }
}
