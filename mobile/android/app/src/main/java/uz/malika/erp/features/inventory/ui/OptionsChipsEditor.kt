package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Chip editor for a `select` attribute's options. Type, then either the IME
 * Done key or the explicit add pill commits the value (the pill is there
 * because not every keyboard in a bottom sheet surfaces Done); tap the × on a
 * chip to remove it. The parent owns the list.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OptionsChipsEditor(options: List<String>, onChanged: (List<String>) -> Unit) {
    val t = LocalT.current
    var text by remember { mutableStateOf("") }
    val draft = text.trim()

    fun add() {
        text = ""
        if (draft.isEmpty() || options.contains(draft)) return
        onChanged(options + draft)
    }

    Column {
        Text(t("inventory.attrOptions", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.sm))
        if (options.isNotEmpty()) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm), verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                options.forEach { option ->
                    Row(
                        Modifier
                            .background(Tokens.card, RoundedCornerShape(Tokens.Radius.pill))
                            .padding(start = Tokens.Space.md, end = Tokens.Space.sm, top = 6.dp, bottom = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(option, style = MaterialTheme.typography.labelMedium, color = Tokens.text)
                        Spacer(Modifier.width(Tokens.Space.xs))
                        Box(
                            Modifier.size(Tokens.Space.gutter).clickable { onChanged(options.filterNot { it == option }) },
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Outlined.Close, contentDescription = null, modifier = Modifier.size(14.dp), tint = Tokens.muted)
                        }
                    }
                }
            }
            Spacer(Modifier.height(Tokens.Space.sm))
        }
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.weight(1f)) {
                AppTextField(
                    value = text,
                    onValueChange = { text = it },
                    placeholder = t("inventory.attrOptionsPlaceholder", null),
                    imeAction = ImeAction.Done,
                    keyboardActions = KeyboardActions(onDone = { add() }),
                )
            }
            Spacer(Modifier.width(Tokens.Space.sm))
            // Ghost, not secondary: a surface-2 fill would vanish on this surface-2 block.
            PillButton(text = t("common.add", null), onClick = { add() }, variant = ButtonVariant.GHOST, enabled = draft.isNotEmpty())
        }
    }
}
