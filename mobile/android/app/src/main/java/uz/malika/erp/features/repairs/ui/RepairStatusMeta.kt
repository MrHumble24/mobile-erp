package uz.malika.erp.features.repairs.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import uz.malika.erp.features.repairs.lib.RepairStatus
import uz.malika.erp.ui.theme.Tokens

/** The one hue per repair status, used by the list chips and the detail header. */
@Composable
fun repairStatusColor(code: String): Color = when (code) {
    RepairStatus.RECEIVED -> Tokens.info
    RepairStatus.IN_REPAIR -> Tokens.warning
    RepairStatus.READY -> Tokens.success
    RepairStatus.GIVEN_BACK -> Tokens.slate
    RepairStatus.CANCELLED -> Tokens.danger
    else -> Tokens.slate
}
