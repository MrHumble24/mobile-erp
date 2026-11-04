package uz.malika.erp.app

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppConfirmDialog
import uz.malika.erp.ui.theme.Tokens

private const val WIDE_BREAKPOINT = 600

/**
 * Adaptive navigation chrome around every authenticated route: a navigation
 * rail on wide layouts (≥ 600dp / tablets), else a Samsung One UI-style bottom
 * bar on phones — the first 4 destinations plus a "More" tab holding the
 * overflow (see [bottomBarSplit] / [OneUiBottomBar] / [MoreScreen]). With fewer
 * than 2 visible entries it falls back to a plain app bar.
 *
 * The top app bar title is the current destination's own label (not a fixed app
 * name), so feature screens no longer need their own heading; the offline icon
 * and logout action live there. No drawer / menu icon on phones.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppShell(
    navItems: List<NavItem>,
    currentRoute: String?,
    online: Boolean,
    onSelect: (String) -> Unit,
    onLogout: () -> Unit,
    content: @Composable (Modifier) -> Unit,
) {
    val t = LocalT.current
    var confirmLogout by remember { mutableStateOf(false) }
    val (tabs, overflow) = bottomBarSplit(navItems)

    val titleKey = when (currentRoute) {
        MORE_ROUTE -> "nav.more"
        else -> navItems.firstOrNull { it.route == currentRoute }?.labelKey
    }
    val titleText = if (titleKey != null) t(titleKey, null) else "Malika Bazaar"

    val barActions: @Composable RowScope.() -> Unit = {
        if (!online) {
            Icon(Icons.Outlined.CloudOff, contentDescription = t("common.offline", null), tint = Tokens.muted)
        }
        IconButton(onClick = { confirmLogout = true }) {
            Icon(Icons.AutoMirrored.Outlined.Logout, contentDescription = t("auth.logout", null))
        }
    }

    val topBar: @Composable () -> Unit = {
        TopAppBar(
            title = { Text(titleText) },
            actions = barActions,
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Tokens.ground,
                titleContentColor = Tokens.text,
                actionIconContentColor = Tokens.text,
            ),
        )
    }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        val wide = maxWidth.value >= WIDE_BREAKPOINT
        when {
            navItems.size < 2 -> Scaffold(topBar = topBar, containerColor = Tokens.ground) { pad -> content(Modifier.padding(pad)) }

            wide -> Row(Modifier.fillMaxSize()) {
                NavigationRail(containerColor = Tokens.card) {
                    navItems.forEach { item ->
                        NavigationRailItem(
                            selected = currentRoute == item.route,
                            onClick = { onSelect(item.route) },
                            icon = { Icon(item.icon, contentDescription = null) },
                            label = { Text(t(item.labelKey, null)) },
                            colors = NavigationRailItemDefaults.colors(
                                selectedIconColor = Tokens.action,
                                selectedTextColor = Tokens.action,
                                unselectedIconColor = Tokens.muted,
                                unselectedTextColor = Tokens.muted,
                                indicatorColor = Tokens.surface2,
                            ),
                        )
                    }
                }
                Scaffold(topBar = topBar, containerColor = Tokens.ground) { pad -> content(Modifier.padding(pad)) }
            }

            else -> Scaffold(
                topBar = topBar,
                bottomBar = { OneUiBottomBar(tabs, overflow, currentRoute, onSelect) },
                containerColor = Tokens.ground,
            ) { pad -> content(Modifier.padding(pad)) }
        }
    }

    if (confirmLogout) {
        AppConfirmDialog(
            title = t("auth.logoutConfirmTitle", null),
            message = t("auth.logoutConfirmDescription", null),
            confirmLabel = t("auth.logout", null),
            cancelLabel = t("common.cancel", null),
            destructive = true,
            onConfirm = { confirmLogout = false; onLogout() },
            onDismiss = { confirmLogout = false },
        )
    }
}
