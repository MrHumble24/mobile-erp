package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.Tokens

/**
 * A scrolling filter bottom sheet: a header with the [title] and, when
 * [canReset], a ghost reset button; then the caller's [content] controls spaced
 * out; then a full-width close button. The column scrolls so a long filter set
 * clears the keyboard. `common.reset` is not in the bundle, so reset reuses the
 * existing `expenses.resetFilters` copy.
 */
@Composable
fun FilterSheet(
    title: String,
    onDismiss: () -> Unit,
    canReset: Boolean,
    onReset: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    val t = LocalT.current
    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.section),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.section),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                if (canReset) {
                    PillButton(t("expenses.resetFilters", null), onClick = onReset, variant = ButtonVariant.GHOST)
                }
            }
            Column(
                Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(Tokens.Space.section),
                content = content,
            )
            PillButton(t("common.close", null), onClick = onDismiss, modifier = Modifier.fillMaxWidth())
        }
    }
}
