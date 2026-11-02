package uz.malika.erp.features.nasiya

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Handshake
import androidx.compose.material.icons.outlined.Storefront
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.nasiya.ui.ConsignmentsScreen
import uz.malika.erp.features.nasiya.ui.PartnersScreen

/**
 * The Partners & Consignment (Nasiya) slice group, mounted as ONE feature with
 * two permission-gated nav items. Kept as one slice because the consign-device
 * flow is shared by both screens (new-consignment-for-partner) and both read the
 * same partner mirror — so there is no cross-slice import to duplicate.
 */
object NasiyaFeature : FeatureModule {

    const val PARTNERS = "partners"
    const val CONSIGNMENTS = "consignments"

    override val navItems = listOf(
        NavItem(PARTNERS, "nav.partners", Icons.Outlined.Storefront, permission = "partner.read"),
        NavItem(CONSIGNMENTS, "nav.consignments", Icons.Outlined.Handshake, permission = "consignment.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable(PARTNERS) {
            PermissionGate("partner.read") { PartnersScreen(container) }
        }
        builder.composable(CONSIGNMENTS) {
            PermissionGate("consignment.read") { ConsignmentsScreen(container) }
        }
    }
}
