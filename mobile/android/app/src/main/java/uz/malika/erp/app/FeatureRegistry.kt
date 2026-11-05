package uz.malika.erp.app

import uz.malika.erp.features.admin.AdminFeature
import uz.malika.erp.features.balance.BalanceFeature
import uz.malika.erp.features.credit.CreditFeature
import uz.malika.erp.features.customs.CustomsFeature
import uz.malika.erp.features.devconsole.DevConsoleFeature
import uz.malika.erp.features.finance.FinanceFeature
import uz.malika.erp.features.inventory.InventoryFeature
import uz.malika.erp.features.nasiya.NasiyaFeature
import uz.malika.erp.features.procurement.ProcurementFeature
import uz.malika.erp.features.purchases.PurchasesFeature
import uz.malika.erp.features.sales.ui.SalesFeature
import uz.malika.erp.features.shifts.ShiftsFeature
import uz.malika.erp.features.stock.StockFeature

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE EXTENSION POINT (integrator-owned). To add a feature slice:
 *   1. build it under `features/<slice>/` with one `FeatureModule` object
 *      (see FOUNDATION.md),
 *   2. add ONE line to [features] below: `MyFeature,`.
 * Nothing else in `app/` changes. The shell builds nav + routes from this list,
 * filtering nav items by the user's permissions and gating routes inline.
 * ─────────────────────────────────────────────────────────────────────────
 */
object FeatureRegistry {
    val features: List<FeatureModule> = listOf(
        FinanceFeature,
        BalanceFeature,
        CreditFeature,
        ShiftsFeature,
        CustomsFeature,
        PurchasesFeature,
        SalesFeature,
        InventoryFeature,
        StockFeature,
        ProcurementFeature,
        NasiyaFeature,
        AdminFeature,
        DevConsoleFeature, // route only; its nav entry is gated by DevAccess in the shell
    )

    /**
     * The shell's nav order. Features contribute contiguous nav blocks, so the
     * flat list is reordered to this single source of truth (dashboard first,
     * sync last). A route missing here falls to the end, preserving its feature
     * order.
     */
    private val navOrder: List<String> = listOf(
        "dashboard", "pos", "sales", "inventory", "stock", "shipments", "qc",
        "consignments", "partners", "customers", "expenses", "balance", "credits", "shifts", "purchases", "repairs", "customs", "reports",
        "users", "settings", "sync",
    )

    /** Nav entries from every feature, in [navOrder]. */
    val navItems: List<NavItem>
        get() = features.flatMap { it.navItems }
            .sortedBy { navOrder.indexOf(it.route).let { i -> if (i < 0) navOrder.size else i } }

    /** The route the shell lands on first. */
    val startRoute: String get() = "dashboard"
}
