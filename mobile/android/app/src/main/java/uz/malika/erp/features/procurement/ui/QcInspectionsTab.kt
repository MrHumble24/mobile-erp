package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.procurement.data.QcInspectionDto
import uz.malika.erp.features.procurement.model.ResultFilter
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.FilterButton
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Past inspections, newest first, as cards — pass/fail filter lives in the filter sheet. */
@Composable
fun QcInspectionsTab(
    page: PageState<QcInspectionDto>,
    filter: ResultFilter,
    onFilter: (ResultFilter) -> Unit,
    onLoadMore: () -> Unit,
) {
    val t = LocalT.current
    var showFilters by remember { mutableStateOf(false) }
    Column {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.xs),
            horizontalArrangement = Arrangement.End,
        ) {
            FilterButton(activeCount = if (filter != ResultFilter.ALL) 1 else 0, onClick = { showFilters = true })
        }
        LazyColumn(
            contentPadding = PaddingValues(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = Tokens.Space.lg),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
        ) {
            if (page.items.isEmpty() && !page.loading) {
                item { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("common.notFound", null), compact = true) } }
            } else {
                items(page.items, key = { it.id }) { item -> InspectionRow(item) }
                item { LoadMoreFooter(hasMore = page.hasMore, loading = page.loading, onLoadMore = onLoadMore) }
            }
        }
    }

    if (showFilters) {
        QcInspectionsFilterSheet(
            filter = filter,
            onFilter = onFilter,
            onReset = { onFilter(ResultFilter.ALL) },
            onDismiss = { showFilters = false },
        )
    }
}

/** Model + mono IMEI, then grade · inspector · time; the result pill right. */
@Composable
private fun InspectionRow(item: QcInspectionDto) {
    val t = LocalT.current
    val meta = listOfNotNull(
        item.inspectorName.takeIf { it.isNotBlank() },
        formatDateTime(item.inspectedAt),
    ).joinToString(" · ")
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(item.modelLabel.ifBlank { item.imei }, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(item.imei, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                Text(meta, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                item.gradeCode?.let { StatusChip(label = it, color = Tokens.sold) }
                StatusChip(
                    label = t(if (item.passed) "qc.passed" else "qc.failed", null),
                    color = if (item.passed) Tokens.success else Tokens.danger,
                )
            }
        }
    }
}
