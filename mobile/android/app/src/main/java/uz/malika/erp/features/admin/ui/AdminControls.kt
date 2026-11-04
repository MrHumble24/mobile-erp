package uz.malika.erp.features.admin.ui

import androidx.compose.runtime.Composable
import uz.malika.erp.shared.ui.AppCheckbox
import uz.malika.erp.shared.ui.AppSwitch

/**
 * Thin admin aliases over the shared Warm Card toggles ([AppCheckbox] /
 * [AppSwitch]). Kept so the admin call sites (RoleCheckboxes,
 * RolePermissionsSheet) read in their own vocabulary; the colouring lives once
 * in `shared/ui/Toggles.kt`.
 */
@Composable
fun AdminCheckbox(checked: Boolean, onCheckedChange: (Boolean) -> Unit) =
    AppCheckbox(checked = checked, onCheckedChange = onCheckedChange)

@Composable
fun AdminSwitch(checked: Boolean, onCheckedChange: (Boolean) -> Unit, enabled: Boolean = true) =
    AppSwitch(checked = checked, onCheckedChange = onCheckedChange, enabled = enabled)
