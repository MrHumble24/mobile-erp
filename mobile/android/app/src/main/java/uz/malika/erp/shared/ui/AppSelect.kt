package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * Warm Card single-select — a read-only [AppTextField]-styled anchor plus an
 * [androidx.compose.material3.ExposedDropdownMenuBoxScope.ExposedDropdownMenu]
 * themed to the card (radius 16, white container, zero elevation, 48 dp items,
 * selected item tinted surface-2). When [nullOption] is set a leading "clear"
 * entry maps to null, so `onSelect` carries a nullable value.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T> AppSelect(
    value: T?,
    options: List<T>,
    optionLabel: (T) -> String,
    onSelect: (T?) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String? = null,
    enabled: Boolean = true,
    nullOption: String? = null,
) {
    var expanded by remember { mutableStateOf(false) }
    val display = value?.let(optionLabel) ?: (nullOption ?: "")

    Column(modifier) {
        if (label != null) {
            Text(label, style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
            Spacer(Modifier.height(6.dp))
        }
        ExposedDropdownMenuBox(
            expanded = expanded && enabled,
            onExpandedChange = { if (enabled) expanded = it },
        ) {
            OutlinedTextField(
                value = display,
                onValueChange = {},
                readOnly = true,
                enabled = enabled,
                singleLine = true,
                shape = RoundedCornerShape(Tokens.Radius.inputs),
                placeholder = placeholder?.let { { Text(it) } },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                    .fillMaxWidth()
                    .height(52.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Tokens.text,
                    unfocusedBorderColor = Tokens.border,
                    cursorColor = Tokens.text,
                    focusedContainerColor = Tokens.card,
                    unfocusedContainerColor = Tokens.card,
                    focusedPlaceholderColor = Tokens.muted,
                    unfocusedPlaceholderColor = Tokens.muted,
                ),
            )
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                shape = RoundedCornerShape(Tokens.Radius.cards),
                containerColor = Tokens.card,
                tonalElevation = 0.dp,
                shadowElevation = 0.dp,
            ) {
                if (nullOption != null) {
                    SelectItem(nullOption, selected = value == null) { onSelect(null); expanded = false }
                }
                options.forEach { option ->
                    SelectItem(optionLabel(option), selected = option == value) {
                        onSelect(option); expanded = false
                    }
                }
            }
        }
    }
}

@Composable
private fun SelectItem(label: String, selected: Boolean, onClick: () -> Unit) {
    DropdownMenuItem(
        text = { Text(label, style = MaterialTheme.typography.bodyLarge) },
        onClick = onClick,
        modifier = if (selected) Modifier.background(Tokens.surface2) else Modifier,
    )
}
