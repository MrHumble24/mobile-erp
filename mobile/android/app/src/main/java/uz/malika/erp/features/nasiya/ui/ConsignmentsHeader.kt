package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Box
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.nasiya.data.ConsignmentTab
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.TabChipItem
import uz.malika.erp.shared.ui.TabChips
import uz.malika.erp.ui.theme.Tokens

/**
 * The status tabs as the kit chip row (five labels truncate in a fixed
 * segmented control); Out and Overdue carry their live counts.
 */
@Composable
fun StatusTabChips(selected: ConsignmentTab, open: Int?, overdue: Int?, onSelect: (ConsignmentTab) -> Unit) {
    val t = LocalT.current
    TabChips(
        items = listOf(
            TabChipItem(ConsignmentTab.ALL, t("common.all", null)),
            TabChipItem(ConsignmentTab.OUT, t("consignments.statusOut", null), open, Tokens.info),
            TabChipItem(ConsignmentTab.OVERDUE, t("consignments.statusOverdue", null), overdue, Tokens.danger),
            TabChipItem(ConsignmentTab.SETTLED, t("consignments.statusSettled", null), hue = Tokens.success),
            TabChipItem(ConsignmentTab.RETURNED, t("consignments.statusReturned", null), hue = Tokens.sold),
        ),
        selected = selected,
        onSelect = onSelect,
    )
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
