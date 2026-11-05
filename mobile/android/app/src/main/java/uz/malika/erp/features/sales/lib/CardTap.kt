package uz.malika.erp.features.sales.lib

import uz.malika.erp.features.sales.data.CatalogCard
import uz.malika.erp.features.sales.data.CatalogUnitItem

/** What tapping a catalog card resolves to (ADR 0031, Change 5). */
sealed interface CardTap {
    /** A quantity product: goes straight into the cart (qty 1 / raise). */
    data object AddQuantity : CardTap

    /** Exactly one unit left to sell: put it in the cart directly. */
    data class AddUnit(val unit: CatalogUnitItem) : CardTap

    /** Several units left: the seller picks one from a sheet. */
    data class PickUnit(val units: List<CatalogUnitItem>) : CardTap

    /** Every in-stock unit is already in the cart (or none remain). */
    data object NoneAvailable : CardTap
}

/**
 * Decide what a card tap does (pure, unit-tested). A quantity product always
 * adds. For a unit product, units already in the cart ([cartUnitCodes], the
 * IMEI/serial keys of CartLine.Unit lines) are dropped first — a unit is never
 * offered twice — then: none left → NoneAvailable, exactly one → AddUnit,
 * otherwise → PickUnit.
 */
fun resolveCardTap(
    card: CatalogCard,
    units: List<CatalogUnitItem>,
    cartUnitCodes: Set<String>,
): CardTap {
    if (card.isQuantity) return CardTap.AddQuantity
    val available = units.filter { it.code !in cartUnitCodes }
    return when (available.size) {
        0 -> CardTap.NoneAvailable
        1 -> CardTap.AddUnit(available.first())
        else -> CardTap.PickUnit(available)
    }
}
