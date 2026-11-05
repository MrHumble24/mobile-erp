import Foundation

/// What a card tap resolves to before any fetch (ADR 0031): a quantity product
/// goes straight to the cart; a unit product needs its in-stock units first.
enum CatalogTapOutcome {
    case quantity(CatalogEntry)
    case needsUnits(CatalogEntry)
}

/// What the fetched units resolve to, after dropping the ones already in the
/// cart: nothing sellable, exactly one (added directly) or several (picker).
enum CatalogUnitOutcome {
    case none
    case one(CatalogUnit)
    case pick([CatalogUnit])
}

/// Pure tap rules for the till catalog (ADR 0031), mirroring the web
/// `use-catalog-pick`. Kept free of UI/async so the DEBUG self-check can drive
/// every branch: quantity, one unit, several units, unit already in the cart.
enum CatalogPick {
    static func tap(_ entry: CatalogEntry) -> CatalogTapOutcome {
        entry.isQuantity ? .quantity(entry) : .needsUnits(entry)
    }

    /// `excludingCodes` are the unit codes already in the cart — never offered
    /// again (a unit shows under its IMEI or serial, whichever it has).
    static func resolveUnits(_ units: [CatalogUnit], excludingCodes exclude: Set<String>) -> CatalogUnitOutcome {
        let free = units.filter { !exclude.contains($0.code) }
        switch free.count {
        case 0: return .none
        case 1: return .one(free[0])
        default: return .pick(free)
        }
    }
}
