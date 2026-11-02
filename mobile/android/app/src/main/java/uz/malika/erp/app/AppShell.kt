package uz.malika.erp.app

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppConfirmDialog
import uz.malika.erp.ui.theme.Tokens

private const val WIDE_BREAKPOINT = 600
private const val MAX_BOTTOM_BAR_ITEMS = 5

/**
 * Adaptive navigation chrome around every authenticated route: a navigation
 * rail on wide layouts (≥ 600dp / tablets), a modal drawer on phones when there
 * are more than 5 destinations (a bottom bar would overflow), else a bottom bar.
 * With fewer than 2 visible entries it falls back to a plain app bar so the
 * first waves (one feature) still run.
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
    val scope = rememberCoroutineScope()

    val topBar: @Composable () -> Unit = {
        TopAppBar(
            title = { Text("Malika Bazaar") },
            actions = {
                if (!online) {
                    Icon(Icons.Outlined.CloudOff, contentDescription = t("common.offline", null), tint = Tokens.slate)
                }
                IconButton(onClick = { confirmLogout = true }) {
                    Icon(Icons.AutoMirrored.Outlined.Logout, contentDescription = t("auth.logout", null))
                }
            },
        )
    }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        val wide = maxWidth.value >= WIDE_BREAKPOINT
        when {
            navItems.size < 2 -> Scaffold(topBar = topBar) { pad -> content(Modifier.padding(pad)) }

            wide -> Row(Modifier.fillMaxSize()) {
                NavigationRail {
                    navItems.forEach { item ->
                        NavigationRailItem(
                            selected = currentRoute == item.route,
                            onClick = { onSelect(item.route) },
                            icon = { Icon(item.icon, contentDescription = null) },
                            label = { Text(t(item.labelKey, null)) },
                        )
                    }
                }
                Scaffold(topBar = topBar) { pad -> content(Modifier.padding(pad)) }
            }

            navItems.size > MAX_BOTTOM_BAR_ITEMS -> {
                val drawerState = androidx.compose.material3.rememberDrawerState(
                    androidx.compose.material3.DrawerValue.Closed,
                )
                ModalNavigationDrawer(
                    drawerState = drawerState,
                    drawerContent = {
                        ModalDrawerSheet {
                            navItems.forEach { item ->
                                NavigationDrawerItem(
                                    selected = currentRoute == item.route,
                                    onClick = {
                                        scope.launch { drawerState.close() }
                                        onSelect(item.route)
                                    },
                                    icon = { Icon(item.icon, contentDescription = null) },
                                    label = { Text(t(item.labelKey, null)) },
                                )
                            }
                        }
                    },
                ) {
                    Scaffold(
                        topBar = {
                            TopAppBar(
                                title = { Text("Malika Bazaar") },
                                navigationIcon = {
                                    IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                        Icon(Icons.Outlined.Menu, contentDescription = t("nav.toggle", null))
                                    }
                                },
                                actions = {
                                    IconButton(onClick = { confirmLogout = true }) {
                                        Icon(Icons.AutoMirrored.Outlined.Logout, contentDescription = t("auth.logout", null))
                                    }
                                },
                            )
                        },
                    ) { pad -> content(Modifier.padding(pad)) }
                }
            }

            else -> Scaffold(
                topBar = topBar,
                bottomBar = {
                    NavigationBar {
                        navItems.forEach { item ->
                            NavigationBarItem(
                                selected = currentRoute == item.route,
                                onClick = { onSelect(item.route) },
                                icon = { Icon(item.icon, contentDescription = null) },
                                label = { Text(t(item.labelKey, null)) },
                            )
                        }
                    }
                },
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
