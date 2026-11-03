package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.QcInspectionDto
import uz.malika.erp.features.procurement.model.ResultFilter
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.FilterButton
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Past inspections, newest first — pass/fail filter lives in the filter sheet. */
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
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.End,
        ) {
            FilterButton(
                activeCount = if (filter != ResultFilter.ALL) 1 else 0,
                onClick = { showFilters = true },
            )
        }
        if (page.items.isEmpty() && !page.loading) {
            EmptyView(t("qc.queueEmpty", null))
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(page.items, key = { it.id }) { item ->
                    val subtitle = listOf(
                        item.modelLabel,
                        item.gradeCode?.let { "${t("qc.grade", null)}: $it" } ?: "",
                        item.inspectorName,
                    ).filter { it.isNotBlank() }.joinToString(" · ")
                    AppCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                ImeiText(item.imei, style = MaterialTheme.typography.bodyMedium)
                                Spacer(Modifier.height(4.dp))
                                Text(subtitle, style = MaterialTheme.typography.bodySmall)
                            }
                            StatusChip(
                                label = t(if (item.passed) "qc.passed" else "qc.failed", null),
                                color = if (item.passed) Tokens.success else Tokens.danger,
                            )
                        }
                    }
                }
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
