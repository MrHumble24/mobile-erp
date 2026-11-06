import Foundation
import Observation

/// Shared count of NEW orders for the More-tab badge (handoff 029). A singleton
/// so `MoreTab` can show it without owning the orders feature; refreshed when the
/// More tab appears and after a status change. Online only — a failed fetch keeps
/// the last value, nothing is persisted.
@MainActor
@Observable
final class OrdersBadge {
    static let shared = OrdersBadge()
    private(set) var count = 0

    private init() {}

    func refresh(_ container: AppContainer) {
        guard container.connectivity.isOnline, container.session.can("order.read") else { return }
        Task {
            if let stats = try? await OrdersRepository(container).stats() {
                count = stats.new
            }
        }
    }
}
