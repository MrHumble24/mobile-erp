package uz.malika.erp.shared.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
 * A thin themed table for tabular screens (sales, reports). On wide windows it
 * is a horizontally scrollable column grid; on compact width ([isCompactWidth])
 * each record stacks as a two-line row — the first column as primary text, the
 * rest as labelled values — so nothing clips on a phone. Pass
 * [stackOnCompact] = false for a grid that must stay a grid (the permission
 * matrix), which keeps horizontal scroll at every width. Each column has a
 * fixed [columnWidths] entry (dp).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun <T> AppDataTable(
    columns: List<String>,
    rows: List<T>,
    columnWidths: List<Int>,
    cell: (row: T, columnIndex: Int) -> String,
    modifier: Modifier = Modifier,
    onRowClick: ((T) -> Unit)? = null,
    stackOnCompact: Boolean = true,
) {
    if (stackOnCompact && isCompactWidth()) {
        Column(modifier.fillMaxWidth()) {
            rows.forEach { row ->
                val rowMod = if (onRowClick != null) Modifier.clickable { onRowClick(row) } else Modifier
                StackedRecord(columns, rowMod.fillMaxWidth().padding(vertical = 12.dp)) { i -> cell(row, i) }
                HorizontalDivider(color = Tokens.border)
            }
        }
        return
    }
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

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StackedRecord(columns: List<String>, modifier: Modifier, cell: (Int) -> String) {
    Column(modifier) {
        Text(cell(0), style = MaterialTheme.typography.bodyMedium, color = Tokens.foreground)
        if (columns.size > 1) {
            FlowRow(
                Modifier.fillMaxWidth().padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                for (i in 1 until columns.size) {
                    Text(
                        "${columns[i]}: ${cell(i)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.mutedForeground,
                    )
                }
            }
        }
    }
}
