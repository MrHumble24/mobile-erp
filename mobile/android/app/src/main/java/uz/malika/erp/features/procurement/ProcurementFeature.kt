package uz.malika.erp.features.procurement

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.FactCheck
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.procurement.ui.QcScreen
import uz.malika.erp.features.procurement.ui.ShipmentsScreen

/**
 * Procurement & QC slice group: shipments + suppliers + device intake (landed
 * cost, IMEI scanning) and the QC workspace (queue, grade, stats, lookups).
 * Two nav items, each gated by a permission CODE; routes gate inline too.
 * Suppliers has no nav item — it is a tab inside the Shipments screen.
 */
object ProcurementFeature : FeatureModule {

    override val navItems = listOf(
        NavItem("shipments", "nav.shipments", Icons.Outlined.LocalShipping, permission = "shipment.read"),
        NavItem("qc", "nav.qc", Icons.AutoMirrored.Outlined.FactCheck, permission = "qc.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("shipments") {
            PermissionGate("shipment.read") { ShipmentsScreen(container) }
        }
        builder.composable("qc") {
            PermissionGate("qc.read") { QcScreen(container) }
        }
    }
}
