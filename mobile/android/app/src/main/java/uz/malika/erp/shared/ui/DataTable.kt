package uz.malika.erp.shared.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * A thin themed table for tabular screens (sales, reports). Horizontally
 * scrollable so it survives narrow widths. For simple vertical lists prefer a
 * `LazyColumn` of [AppCard]s; use this when columns matter. Each column has a
 * fixed [columnWidths] entry (dp).
 */
@Composable
fun <T> AppDataTable(
    columns: List<String>,
    rows: List<T>,
    columnWidths: List<Int>,
    cell: (row: T, columnIndex: Int) -> String,
    modifier: Modifier = Modifier,
    onRowClick: ((T) -> Unit)? = null,
) {
    val scroll = rememberScrollState()
    Column(modifier.horizontalScroll(scroll)) {
        Row(Modifier.padding(vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            columns.forEachIndexed { i, name ->
                Text(
                    name,
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.width(columnWidths.getOrElse(i) { 120 }.dp),
                )
            }
        }
        HorizontalDivider(color = Tokens.border)
        rows.forEach { row ->
            val rowMod = if (onRowClick != null) Modifier.clickable { onRowClick(row) } else Modifier
            Row(
                rowMod.fillMaxWidth().padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                columns.indices.forEach { i ->
                    Text(
                        cell(row, i),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.width(columnWidths.getOrElse(i) { 120 }.dp),
                    )
                }
            }
            HorizontalDivider(color = Tokens.border)
        }
    }
}
