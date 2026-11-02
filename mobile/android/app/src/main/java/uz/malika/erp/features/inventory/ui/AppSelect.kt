package uz.malika.erp.features.inventory.ui

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
 * Slice-local Caldera select — the shared UI kit ships no dropdown, so this is
 * built from a read-only [OutlinedTextField] + [ExposedDropdownMenuBox] with
 * Tokens styling (radius-9, bone border, signal-blue ring), matching
 * [uz.malika.erp.shared.ui.AppTextField]. Candidate to promote into shared/ui.
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
    nullOption: String? = null, // when set, a leading "clear" entry mapping to null
) {
    var expanded by remember { mutableStateOf(false) }
    val shape = RoundedCornerShape(9.dp)
    val display = value?.let(optionLabel) ?: (nullOption ?: "")

    Column(modifier) {
        if (label != null) {
            Text(label, style = MaterialTheme.typography.labelLarge)
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
                shape = shape,
                placeholder = placeholder?.let { { Text(it) } },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                    .fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Tokens.ring,
                    unfocusedBorderColor = Tokens.border,
                    focusedContainerColor = Tokens.surfaceCanvas,
                    unfocusedContainerColor = Tokens.surfaceCanvas,
                ),
            )
            ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                if (nullOption != null) {
                    DropdownMenuItem(
                        text = { Text(nullOption) },
                        onClick = { onSelect(null); expanded = false },
                    )
                }
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(optionLabel(option)) },
                        onClick = { onSelect(option); expanded = false },
                    )
                }
            }
        }
    }
}
