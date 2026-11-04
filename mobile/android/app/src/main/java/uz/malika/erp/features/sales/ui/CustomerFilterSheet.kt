package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/**
 * Customer directory filters in a bottom sheet: has-purchases and sort, each
 * under its label. Search stays inline on the screen. Both controls apply
 * immediately through the ViewModel (each resets to page 1).
 */
@Composable
fun CustomerFilterSheet(
    hasPurchases: String,
    sort: String,
    onHasPurchases: (String) -> Unit,
    onSort: (String) -> Unit,
    canReset: Boolean,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(title = t("common.filter", null), onDismiss = onDismiss, canReset = canReset, onReset = onReset) {
        Labelled(t("customers.filterPurchases", null)) {
            SegmentedControl(
                options = listOf(
                    SegmentOption("all", t("common.all", null)),
                    SegmentOption("yes", t("customers.hasPurchasesYes", null)),
                    SegmentOption("no", t("customers.hasPurchasesNo", null)),
                ),
                selected = hasPurchases,
                onSelect = onHasPurchases,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Labelled(t("customers.sortLabel", null)) {
            SegmentedControl(
                options = listOf(
                    SegmentOption("recent", t("customers.sortRecent", null)),
                    SegmentOption("name", t("customers.sortName", null)),
                ),
                selected = sort,
                onSelect = onSort,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun Labelled(label: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        content()
    }
}
