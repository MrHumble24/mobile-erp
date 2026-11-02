package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import uz.malika.erp.ui.theme.Tokens

/**
 * Chip editor for a `select` attribute's options: type + Done to add, tap the X
 * to remove. The parent owns the list.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OptionsChipsEditor(options: List<String>, onChanged: (List<String>) -> Unit) {
    val t = LocalT.current
    var text by remember { mutableStateOf("") }

    fun add() {
        val value = text.trim()
        text = ""
        if (value.isEmpty() || options.contains(value)) return
        onChanged(options + value)
    }

    Column {
        Text(t("inventory.attrOptions", null), style = MaterialTheme.typography.labelMedium, color = Tokens.slate)
        Spacer(Modifier.height(4.dp))
        if (options.isNotEmpty()) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                options.forEach { option ->
                    Row(
                        Modifier
                            .background(Tokens.mist, RoundedCornerShape(100.dp))
                            .padding(start = 12.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(option, style = MaterialTheme.typography.labelLarge)
                        Spacer(Modifier.width(4.dp))
                        Icon(
                            Icons.Outlined.Close,
                            contentDescription = null,
                            modifier = Modifier
                                .size(16.dp)
                                .clickable { onChanged(options.filterNot { it == option }) },
                            tint = Tokens.slate,
                        )
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
        }
        AppTextField(
            value = text,
            onValueChange = { text = it },
            placeholder = t("inventory.attrOptionsPlaceholder", null),
            imeAction = ImeAction.Done,
            keyboardActions = KeyboardActions(onDone = { add() }),
        )
    }
}
