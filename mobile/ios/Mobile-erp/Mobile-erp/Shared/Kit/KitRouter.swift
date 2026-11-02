import Observation

/// Cross-feature navigation. One destination per other feature's screen, so a
/// view or view model can jump to another tab (and hand it a target id) without
/// importing that feature. The router owns the shell's tab `selection`; a route
/// sets the selection and parks a one-shot payload the target feature consumes.
///
/// Usage from anywhere that holds the `AppContainer`:
///   container.router.open(.inventory(imei: "356938035643809"))
///   container.router.open(.pos())            // open POS, no preselected device
///   container.router.open(.sales(saleId: id))
///
/// The destination feature, in its root `.task`/`.onChange`, pulls the arg:
///   if let route = container.router.consume("inventory"),
///      case let .inventory(imei) = route { store.focus(imei) }
///
/// `featureId` values match `FeatureModule.id` in `FeatureRegistry` — the only
/// contract between the two. Adding a feature target = add a case here.
enum KitRoute: Equatable {
    case inventory(imei: String? = nil)
    case pos(imei: String? = nil)
    case qc(imei: String? = nil)
    case sales(saleId: String? = nil)
    case consignments(id: String? = nil)

    /// The tab the route lands on — must equal the target's `FeatureModule.id`.
    var featureId: String {
        switch self {
        case .inventory: return "inventory"
        case .pos: return "pos"
        case .qc: return "qc"
        case .sales: return "sales"
        case .consignments: return "consignments"
        }
    }
}

@Observable
@MainActor
final class KitRouter {
    /// The selected tab id; bound by `AppShell`'s `TabView`.
    var selection: String = ""
    /// One-shot payload for the feature named by `selection`, cleared on consume.
    private(set) var pending: KitRoute?

    /// Switch to the route's feature and park its argument for that feature.
    func open(_ route: KitRoute) {
        pending = route
        selection = route.featureId
    }

    /// Returns and clears the pending route iff it targets `featureId`.
    /// The destination feature calls this once when it appears/changes.
    func consume(_ featureId: String) -> KitRoute? {
        guard let route = pending, route.featureId == featureId else { return nil }
        pending = nil
        return route
    }
}
