package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.nasiya.data.ConsignmentTab
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The status tabs as a scrolling chip row (five labels truncate in a fixed
 * segmented control). Selected = status pill pair; Out and Overdue carry their
 * live counts in mono.
 */
@Composable
fun StatusTabChips(selected: ConsignmentTab, open: Int?, overdue: Int?, onSelect: (ConsignmentTab) -> Unit) {
    val t = LocalT.current
    val chips = listOf(
        Triple(ConsignmentTab.ALL, t("common.all", null), null as Int?),
        Triple(ConsignmentTab.OUT, t("consignments.statusOut", null), open),
        Triple(ConsignmentTab.OVERDUE, t("consignments.statusOverdue", null), overdue),
        Triple(ConsignmentTab.SETTLED, t("consignments.statusSettled", null), null),
        Triple(ConsignmentTab.RETURNED, t("consignments.statusReturned", null), null),
    )
    LazyRow(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
        contentPadding = PaddingValues(horizontal = Tokens.Space.screenH),
    ) {
        items(chips) { (tab, label, count) ->
            val hue = when (tab) {
                ConsignmentTab.OUT -> Tokens.info
                ConsignmentTab.OVERDUE -> Tokens.danger
                ConsignmentTab.SETTLED -> Tokens.success
                ConsignmentTab.RETURNED -> Tokens.sold
                ConsignmentTab.ALL -> Tokens.text
            }
            TabChip(label, count, hue, tab == selected) { onSelect(tab) }
        }
    }
}

@Composable
private fun TabChip(label: String, count: Int?, hue: Color, selected: Boolean, onTap: () -> Unit) {
    Row(
        Modifier
            .clip(RoundedCornerShape(Tokens.Radius.pill))
            .background(if (selected) hue.copy(alpha = 0.14f) else Tokens.card)
            .clickable(onClick = onTap)
            .height(40.dp)
            .padding(horizontal = Tokens.Space.lg),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = if (selected) hue else Tokens.muted, maxLines = 1)
        count?.let {
            Text(
                it.toString(),
                style = MaterialTheme.typography.labelMedium.copy(fontFamily = MonoFamily),
                color = if (selected) hue else Tokens.text,
            )
        }
    }
}

/** Overflow menu carrying the CSV export (enabled only when there are rows). */
@Composable
fun ConsignmentsOverflowMenu(csvEnabled: Boolean, onCsv: () -> Unit) {
    val t = LocalT.current
    var menu by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { menu = true }) {
            Icon(Icons.Filled.MoreVert, contentDescription = t("common.actions", null), tint = Tokens.text)
        }
        DropdownMenu(
            expanded = menu,
            onDismissRequest = { menu = false },
            shape = RoundedCornerShape(Tokens.Radius.cards),
            containerColor = Tokens.card,
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
        ) {
            DropdownMenuItem(
                text = { Text(t("consignments.exportCsv", null)) },
                enabled = csvEnabled,
                onClick = { menu = false; onCsv() },
            )
        }
    }
}
