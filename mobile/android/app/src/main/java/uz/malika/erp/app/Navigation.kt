package uz.malika.erp.app

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import uz.malika.erp.shared.ui.rememberReduceMotion
import uz.malika.erp.AppContainer
import uz.malika.erp.core.StoreManager
import uz.malika.erp.features.auth.model.SessionViewModel
import uz.malika.erp.features.auth.ui.LoginScreen
import uz.malika.erp.features.devconsole.DEV_CONSOLE_ROUTE
import uz.malika.erp.features.devconsole.DevAccess
import uz.malika.erp.features.devconsole.devConsoleNavItem
import uz.malika.erp.features.devconsole.ui.DevConsoleScreen
import uz.malika.erp.features.stores.ui.ChooseStoreScreen

/**
 * Top-level navigation. Signed out → login (+ the public dev panel). Signed in
 * → the adaptive shell hosting feature routes from [FeatureRegistry]. The two
 * graphs are separate, so there is no redirect dance; a 401 clears the session
 * and the signed-out graph takes over automatically.
 */
@Composable
fun AppNavHost(container: AppContainer, session: SessionViewModel, openRoute: String? = null) {
    val state by session.state.collectAsState()
    val online by container.connectivity.online.collectAsState()
    val activeStoreId by container.storeManager.activeStoreId.collectAsState()

    val user = state.user
    if (user == null) {
        UnauthedNav(container, session, online)
    } else {
        val resolved = StoreManager.resolveActiveStore(user.stores, activeStoreId)
        if (resolved == null) {
            ChooseStoreScreen(
                stores = user.stores,
                onChoose = { store ->
                    container.storeSwitcher.switchStore(store.id)
                },
                onLogout = session::logout,
            )
        } else {
            if (activeStoreId != resolved) {
                LaunchedEffect(resolved) {
                    container.storeManager.setActiveStoreId(resolved)
                }
            }
            androidx.compose.runtime.key(resolved) {
                AuthedShell(container, session, online, openRoute, resolved)
            }
        }
    }
}

/** Material shared-axis X (DESIGN.md Motion): a 30 dp horizontal slide + fade,
 *  220 ms, reversed on pop; a 150 ms crossfade under reduce motion. */
private const val NAV_MS = 220
private const val NAV_FADE = 150

private fun navEnter(offset: Int, reduce: Boolean): EnterTransition =
    if (reduce) {
        fadeIn(tween(NAV_FADE))
    } else {
        slideInHorizontally(tween(NAV_MS, easing = FastOutSlowInEasing)) { offset } + fadeIn(tween(NAV_MS))
    }

private fun navExit(offset: Int, reduce: Boolean): ExitTransition =
    if (reduce) {
        fadeOut(tween(NAV_FADE))
    } else {
        slideOutHorizontally(tween(NAV_MS, easing = FastOutSlowInEasing)) { offset } + fadeOut(tween(NAV_MS))
    }

@Composable
private fun UnauthedNav(container: AppContainer, session: SessionViewModel, online: Boolean) {
    val nav = rememberNavController()
    val reduce = rememberReduceMotion()
    val shift = with(LocalDensity.current) { 30.dp.roundToPx() }
    NavHost(
        nav,
        startDestination = "login",
        enterTransition = { navEnter(shift, reduce) },
        exitTransition = { navExit(-shift, reduce) },
        popEnterTransition = { navEnter(-shift, reduce) },
        popExitTransition = { navExit(shift, reduce) },
    ) {
        composable("login") {
            LoginScreen(session, online, onOpenDevPanel = { nav.navigate(DEV_CONSOLE_ROUTE) })
        }
        composable(DEV_CONSOLE_ROUTE) {
            // This route is rendered bare (no AppShell), so it owns its safe-area
            // inset; the authed in-shell console inherits the shell's padding instead.
            Box(Modifier.fillMaxSize().systemBarsPadding()) {
                DevConsoleScreen(container, onClose = { nav.popBackStack() })
            }
        }
    }
}

@Composable
private fun AuthedShell(
    container: AppContainer,
    session: SessionViewModel,
    online: Boolean,
    openRoute: String? = null,
    activeStoreId: String,
) {
    val user = session.state.value.user ?: return
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    val activeStore = user.stores.find { it.id == activeStoreId }
    val activeStoreName = activeStore?.name ?: ""

    // Debug launch extra `open`: navigate to the requested feature route once, after
    // sign-in puts us in the shell. A bad/forbidden route is ignored (PermissionGate
    // renders its own 403 inside the route).
    LaunchedEffect(openRoute) {
        if (openRoute != null) runCatching { nav.navigate(openRoute) { launchSingleTop = true } }
    }

    val devUnlocked by DevAccess.unlocked.collectAsState()
    val navItems = FeatureRegistry.navItems.filter { it.permission == null || user.can(it.permission) } +
        if (devUnlocked) listOf(devConsoleNavItem) else emptyList()

    // Cross-feature navigation: a slice calls container.featureNav.open(dest);
    // the shell performs the single navigation here (see FeatureNav).
    LaunchedEffect(nav) {
        container.featureNav.destinations.collect { dest ->
            runCatching {
                nav.navigate(dest.route) {
                    launchSingleTop = true
                    restoreState = true
                    popUpTo(FeatureRegistry.startRoute) { saveState = true }
                }
            }
        }
    }

    val reduce = rememberReduceMotion()
    val shift = with(LocalDensity.current) { 30.dp.roundToPx() }

    val select: (String) -> Unit = { route ->
        nav.navigate(route) {
            launchSingleTop = true
            restoreState = true
            popUpTo(FeatureRegistry.startRoute) { saveState = true }
        }
    }
    val overflow = bottomBarSplit(navItems).second

    CompositionLocalProvider(LocalCan provides { code -> user.can(code) }) {
        AppShell(
            navItems = navItems,
            currentRoute = currentRoute,
            online = online,
            onSelect = select,
            onLogout = session::logout,
        ) { modifier ->
            NavHost(
                navController = nav,
                startDestination = FeatureRegistry.startRoute,
                modifier = modifier,
                enterTransition = { navEnter(shift, reduce) },
                exitTransition = { navExit(-shift, reduce) },
                popEnterTransition = { navEnter(-shift, reduce) },
                popExitTransition = { navExit(shift, reduce) },
            ) {
                FeatureRegistry.features.forEach { it.register(this, nav, container) }
                composable(MORE_ROUTE) {
                    MoreScreen(
                        items = overflow,
                        activeStoreName = activeStoreName,
                        stores = user.stores,
                        onSwitchStore = { newStoreId ->
                            container.storeSwitcher.switchStore(newStoreId)
                        },
                        onSelect = select,
                        onRefreshMore = {
                            if (user.can("order.read")) {
                                uz.malika.erp.features.orders.OrdersFeature.refreshBadge(container)
                            }
                        },
                    )
                }
            }
        }
    }
}
