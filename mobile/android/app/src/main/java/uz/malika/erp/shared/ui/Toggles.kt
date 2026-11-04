package uz.malika.erp.shared.ui

import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.ui.theme.Tokens

/**
 * The shared Warm Card toggles. A toggle is pressable, so checked uses the
 * action orange; unchecked rests on a surface-2 track with a warm border. One
 * definition for admin, procurement and inventory (DRY) — never a raw Material
 * switch with ad-hoc `SwitchDefaults.colors`.
 */
@Composable
fun AppSwitch(
    checked: Boolean,
    onCheckedChange: ((Boolean) -> Unit)?,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Switch(
        checked = checked,
        onCheckedChange = onCheckedChange,
        modifier = modifier,
        enabled = enabled,
        colors = SwitchDefaults.colors(
            checkedThumbColor = Tokens.onAction,
            checkedTrackColor = Tokens.action,
            checkedBorderColor = Tokens.action,
            uncheckedThumbColor = Tokens.muted,
            uncheckedTrackColor = Tokens.surface2,
            uncheckedBorderColor = Tokens.border,
        ),
    )
}

@Composable
fun AppCheckbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    Checkbox(
        checked = checked,
        onCheckedChange = onCheckedChange,
        modifier = modifier,
        colors = CheckboxDefaults.colors(
            checkedColor = Tokens.action,
            uncheckedColor = Tokens.border,
            checkmarkColor = Tokens.onAction,
        ),
    )
}
