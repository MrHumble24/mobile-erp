package uz.malika.erp

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.malika.erp.app.AppNavHost
import uz.malika.erp.core.LaunchExtras
import uz.malika.erp.features.auth.model.SessionViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ToastHost
import uz.malika.erp.ui.theme.MalikaTheme

/**
 * App root: the Caldera theme, the locale-bound translate function provided to
 * the whole tree, and the top-level navigation. The session ViewModel is
 * created once here and shared.
 */
@Composable
fun MalikaApp(container: AppContainer, launch: LaunchExtras? = null) {
    MalikaTheme {
        val locale by container.localeStore.locale.collectAsState()
        CompositionLocalProvider(
            LocalT provides { key, params -> container.i18n.t(locale, key, params) },
        ) {
            val session: SessionViewModel = viewModel(factory = container.viewModelFactory)
            // Debug launch extras: sign in through the one real login path (the host
            // override is already applied in MainActivity); `open` navigates below.
            LaunchedEffect(Unit) {
                if (launch?.canSignIn == true) session.login(launch.email!!, launch.password!!)
            }
            // Re-read permissions from the server on app start and on every return to
            // the foreground while online, so a newly granted permission applies
            // without signing out (ADR 0035/0036 need `sale.credit` / `shift.manage`).
            val lifecycleOwner = LocalLifecycleOwner.current
            DisposableEffect(lifecycleOwner) {
                val observer = LifecycleEventObserver { _, event ->
                    if (event == Lifecycle.Event.ON_START && container.connectivity.online.value) {
                        session.refreshPermissions()
                    }
                }
                lifecycleOwner.lifecycle.addObserver(observer)
                onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
            }
            Box(Modifier.fillMaxSize()) {
                AppNavHost(container, session, openRoute = launch?.open)
                ToastHost(container.toaster.toasts, Modifier.align(Alignment.BottomCenter))
            }
        }
    }
}
