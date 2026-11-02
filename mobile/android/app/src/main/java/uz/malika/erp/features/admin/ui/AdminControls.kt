package uz.malika.erp.features.admin.ui

import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import uz.malika.erp.ui.theme.Tokens

/**
 * Caldera-tinted checkbox and switch the shared kit does not yet ship. Built
 * here from [Tokens] (never default Material coloring); the integrator may
 * promote them to `shared/ui` so other slices reuse them.
 */
@Composable
fun AdminCheckbox(checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Checkbox(
        checked = checked,
        onCheckedChange = onCheckedChange,
        colors = CheckboxDefaults.colors(
            checkedColor = Tokens.primary,
            uncheckedColor = Tokens.border,
            checkmarkColor = Tokens.primaryForeground,
        ),
    )
}

@Composable
fun AdminSwitch(checked: Boolean, onCheckedChange: (Boolean) -> Unit, enabled: Boolean = true) {
    Switch(
        checked = checked,
        onCheckedChange = onCheckedChange,
        enabled = enabled,
        colors = SwitchDefaults.colors(
            checkedThumbColor = Tokens.primaryForeground,
            checkedTrackColor = Tokens.primary,
            uncheckedTrackColor = Tokens.border,
        ),
    )
}
