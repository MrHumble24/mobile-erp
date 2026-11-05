package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import uz.malika.erp.features.inventory.data.ProductKind
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.Tokens

/**
 * The product kind as three selectable rows (label + one-line hint). Disabled
 * once the product has stock — the server rejects a kind change (409) and the
 * form shows [catalog.kindLocked] then.
 */
@Composable
fun ProductKindPicker(
    selected: ProductKind,
    onSelect: (ProductKind) -> Unit,
    enabled: Boolean,
) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        Text(t("catalog.productKind", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        ProductKind.entries.forEach { kind ->
            Row(
                Modifier.fillMaxWidth()
                    .heightIn(min = Tokens.minTouch)
                    .selectable(
                        selected = kind == selected,
                        enabled = enabled,
                        role = Role.RadioButton,
                        onClick = { onSelect(kind) },
                    )
                    .padding(vertical = Tokens.Space.xs),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RadioButton(selected = kind == selected, onClick = null, enabled = enabled)
                Spacer(Modifier.width(Tokens.Space.sm))
                Column {
                    Text(t(kind.labelKey, null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                    Text(t(kind.hintKey, null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
            }
        }
        if (!enabled) {
            Text(t("catalog.kindLocked", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        }
    }
}
