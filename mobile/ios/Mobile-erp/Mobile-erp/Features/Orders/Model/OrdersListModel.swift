import Foundation
import Observation

/// Storefront orders list state (handoff 029): one status filter (nil = all),
/// newest first (server order), pages of 20 loaded on scroll. Online only; with
/// no connection it shows the offline note and loads nothing.
@MainActor
@Observable
final class OrdersListModel {
    /// nil = all statuses.
    var status: String?
    private(set) var items: [StorefrontOrderListItem] = []
    private(set) var total = 0
    private(set) var loading = false
    private(set) var loadingMore = false
    var error: String?
    var offline = false

    private let pageSize = 20
    private var page = 1

    @ObservationIgnored private var container: AppContainer?
    private var repo: OrdersRepository { OrdersRepository(api: container!.api) }

    var hasMore: Bool { items.count < total }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else { offline = true; return }
        offline = false
        loading = true
        error = nil
        page = 1
        Task {
            defer { loading = false }
            do {
                let result = try await repo.list(status: status, page: 1, pageSize: pageSize)
                items = result.items
                total = result.total
            } catch let e as AppError {
                error = e.message
            } catch { self.error = error.localizedDescription }
        }
    }

    func loadMore() {
        guard container != nil, !loading, !loadingMore, hasMore else { return }
        loadingMore = true
        let next = page + 1
        Task {
            defer { loadingMore = false }
            do {
                let result = try await repo.list(status: status, page: next, pageSize: pageSize)
                items += result.items
                total = result.total
                page = next
            } catch { /* keep what we have; the row stops requesting */ }
        }
    }
}
