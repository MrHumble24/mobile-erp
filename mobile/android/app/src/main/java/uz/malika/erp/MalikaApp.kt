package uz.malika.erp

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.malika.erp.app.AppNavHost
import uz.malika.erp.features.auth.model.SessionViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.MalikaTheme

/**
 * App root: the Caldera theme, the locale-bound translate function provided to
 * the whole tree, and the top-level navigation. The session ViewModel is
 * created once here and shared.
 */
@Composable
fun MalikaApp(container: AppContainer) {
    MalikaTheme {
        val locale by container.localeStore.locale.collectAsState()
        CompositionLocalProvider(
            LocalT provides { key, params -> container.i18n.t(locale, key, params) },
        ) {
            val session: SessionViewModel = viewModel(factory = container.viewModelFactory)
            AppNavHost(container, session)
        }
    }
}
