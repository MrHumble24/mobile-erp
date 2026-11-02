package uz.malika.erp.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import uz.malika.erp.AppContainer
import uz.malika.erp.features.auth.model.SessionViewModel
import uz.malika.erp.features.auth.ui.LoginScreen
import uz.malika.erp.features.devpanel.DevPanelScreen

/**
 * Top-level navigation. Signed out → login (+ the public dev panel). Signed in
 * → the adaptive shell hosting feature routes from [FeatureRegistry]. The two
 * graphs are separate, so there is no redirect dance; a 401 clears the session
 * and the signed-out graph takes over automatically.
 */
@Composable
fun AppNavHost(container: AppContainer, session: SessionViewModel) {
    val state by session.state.collectAsState()
    val online by container.connectivity.online.collectAsState()

    if (state.user == null) {
        UnauthedNav(container, session, online)
    } else {
        AuthedShell(container, session, online)
    }
}

@Composable
private fun UnauthedNav(container: AppContainer, session: SessionViewModel, online: Boolean) {
    val nav = rememberNavController()
    NavHost(nav, startDestination = "login") {
        composable("login") {
            LoginScreen(session, online, onOpenDevPanel = { nav.navigate("dev") })
        }
        composable("dev") {
            DevPanelScreen(container, onClose = { nav.popBackStack() })
        }
    }
}

@Composable
private fun AuthedShell(container: AppContainer, session: SessionViewModel, online: Boolean) {
    val user = session.state.value.user ?: return
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    val navItems = FeatureRegistry.navItems.filter { it.permission == null || user.can(it.permission) }

    CompositionLocalProvider(LocalCan provides { code -> user.can(code) }) {
        AppShell(
            navItems = navItems,
            currentRoute = currentRoute,
            online = online,
            onSelect = { route ->
                nav.navigate(route) {
                    launchSingleTop = true
                    restoreState = true
                    popUpTo(FeatureRegistry.startRoute) { saveState = true }
                }
            },
            onLogout = session::logout,
        ) { modifier ->
            NavHost(
                navController = nav,
                startDestination = FeatureRegistry.startRoute,
                modifier = modifier,
            ) {
                FeatureRegistry.features.forEach { it.register(this, nav, container) }
            }
        }
    }
}
