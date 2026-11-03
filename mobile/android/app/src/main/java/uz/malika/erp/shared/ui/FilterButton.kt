package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.ui.theme.Tokens

/**
 * A 40dp filter icon button. Shows the active-filter count in a primary-tinted
 * [Badge] only when [activeCount] > 0 (the accent token pair, like the fill of
 * a primary [PillButton]). `common.filters` is not in the i18n bundle, so the
 * screen-reader label is the plain English fallback.
 */
@Composable
fun FilterButton(activeCount: Int, onClick: () -> Unit, modifier: Modifier = Modifier) {
    BadgedBox(
        modifier = modifier,
        badge = {
            if (activeCount > 0) {
                Badge(containerColor = Tokens.primary, contentColor = Tokens.primaryForeground) {
                    Text("$activeCount")
                }
            }
        },
    ) {
        IconButton(onClick = onClick, modifier = Modifier.size(Tokens.minTouch)) {
            Icon(Icons.Outlined.FilterList, contentDescription = "Filters", tint = Tokens.foreground)
        }
    }
}
