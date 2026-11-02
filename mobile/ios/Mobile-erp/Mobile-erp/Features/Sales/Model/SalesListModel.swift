import Foundation
import Observation

/// Sales list state: filters, a paginated feed, summary stats, and the cashier
/// options for the sold-by filter. Reads are online-only (sales are not in the
/// offline feed); offline shows a needs-connection note.
@MainActor
@Observable
final class SalesListModel {
    var filters = SaleFilters()
    var stats: SaleStatsView?
    var cashiers: [SalesCashier] = []
    var offline = false

    /// The load-more feed; rebuilt once the container is wired so its fetch can
    /// reach the repository.
    private(set) var pager: KitPaginator<SaleView>!

    @ObservationIgnored private var container: AppContainer?
    private var repo: SalesRepository {
        SalesRepository(api: container!.api, context: container!.modelContext)
    }

    var canViewProfit: Bool { stats?.netProfit != nil }
    var canReadUsers: Bool { container?.session.can("user.read") ?? false }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        pager = KitPaginator<SaleView> { [weak self] page, size in
            guard let self else { return ([], 0) }
            let p = try await self.repo.list(self.filters, page: page, pageSize: size)
            return (p.items, p.total)
        }
    }

    /// Reload the feed + stats for the current filters (online only).
    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else {
            offline = true
            return
        }
        offline = false
        let filters = self.filters
        Task {
            await pager.refresh()
            stats = try? await repo.stats(filters)
        }
        if cashiers.isEmpty, canReadUsers {
            Task { cashiers = (try? await repo.cashiers()) ?? [] }
        }
    }
}
