package uz.malika.erp.features.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.SpaceDashboard
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.i18n.LocalT

/**
 * Placeholder landing feature so the shell runs before real features exist.
 * It is the template every feature copies: one `FeatureModule` object, its nav
 * item(s), and its route registration. Later waves replace/extend it.
 */
object HomeFeature : FeatureModule {
    const val route = "home"

    override val navItems = listOf(
        NavItem(route = route, labelKey = "nav.dashboard", icon = Icons.Outlined.SpaceDashboard),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable(route) { HomeScreen() }
    }
}

@Composable
private fun HomeScreen() {
    val t = LocalT.current
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(t("nav.dashboard", null), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text("Malika Bazaar", style = MaterialTheme.typography.bodyMedium)
    }
}
