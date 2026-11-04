package uz.malika.erp.app

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.Tokens

const val MORE_ROUTE = "__more__"
const val MAX_BOTTOM_BAR_ITEMS = 5
private const val MAX_TABS = 4
private val BAR_HEIGHT = 56.dp
private val ICON_SIZE = 24.dp

/**
 * Phone bottom-bar split, mirroring iOS: up to 5 destinations all fit the bar;
 * beyond that the first 4 stay as tabs and the rest live behind "More".
 * Returns `(tabs, overflow)`; overflow is empty when everything fits.
 */
fun bottomBarSplit(navItems: List<NavItem>): Pair<List<NavItem>, List<NavItem>> =
    if (navItems.size <= MAX_BOTTOM_BAR_ITEMS) navItems to emptyList()
    else navItems.take(MAX_TABS) to navItems.drop(MAX_TABS)

/**
 * Samsung One UI-style bottom navigation: a plain [Tokens.surfaceCanvas] bar with
 * a 1dp top hairline, no elevation and no selection pill. Exactly five equal
 * columns (`weight(1f)` each) — the first 4 destinations plus a "More" tab — so
 * nothing can push past the edge; labels are single-line, 11sp, ellipsized.
 */
@Composable
fun OneUiBottomBar(
    tabs: List<NavItem>,
    overflow: List<NavItem>,
    currentRoute: String?,
    onSelect: (String) -> Unit,
) {
    val t = LocalT.current
    Surface(color = Tokens.card, tonalElevation = 0.dp) {
        Column(Modifier.navigationBarsPadding()) {
            HorizontalDivider(thickness = 1.dp, color = Tokens.border)
            Row(Modifier.fillMaxWidth().height(BAR_HEIGHT), verticalAlignment = Alignment.CenterVertically) {
                tabs.forEach { item ->
                    BarItem(
                        icon = item.icon,
                        label = t(item.labelKey, null),
                        selected = currentRoute == item.route,
                        onClick = { onSelect(item.route) },
                        modifier = Modifier.weight(1f),
                    )
                }
                if (overflow.isNotEmpty()) {
                    val moreActive = currentRoute == MORE_ROUTE || overflow.any { it.route == currentRoute }
                    BarItem(
                        icon = Icons.Outlined.MoreHoriz,
                        label = t("nav.more", null),
                        selected = moreActive,
                        onClick = { onSelect(MORE_ROUTE) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun BarItem(
    icon: ImageVector,
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tint = if (selected) Tokens.action else Tokens.muted
    Column(
        modifier.fillMaxHeight().clickable(onClick = onClick).padding(horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = label, tint = tint, modifier = Modifier.size(ICON_SIZE))
        Spacer(Modifier.height(2.dp))
        Text(
            label,
            color = tint,
            style = MaterialTheme.typography.labelSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            // Shrinks to 9sp before it ellipsizes, so "Bosh sahifa" survives 1.3x.
            autoSize = TextAutoSize.StepBased(minFontSize = 9.sp, maxFontSize = 11.sp, stepSize = 0.5.sp),
        )
    }
}
