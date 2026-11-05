import Foundation
import Observation

/// Customer directory state: search + sort + "has purchases" filter, a paginated
/// feed and summary stats. Reads are online-only; offline shows a note.
@MainActor
@Observable
final class CustomersModel {
    var search = ""
    var hasPurchasesOnly = false
    var sort = "recent"      // "recent" | "name"
    var stats: CustomerStats?
    var offline = false

    private(set) var pager: KitPaginator<CustomerListItem>!

    @ObservationIgnored private var container: AppContainer?
    private var repo: CustomersRepository { CustomersRepository(api: container!.api) }

    var canManage: Bool { container?.session.can("customer.manage") ?? false }
    var isOnline: Bool { container?.connectivity.isOnline ?? false }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        pager = KitPaginator<CustomerListItem>(pageSize: 20) { [weak self] page, size in
            guard let self else { return ([], 0) }
            let p = try await self.repo.page(
                search: self.search,
                hasPurchases: self.hasPurchasesOnly ? true : nil,
                sort: self.sort, page: page, pageSize: size)
            return (p.items, p.total)
        }
    }

    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else {
            offline = true
            return
        }
        offline = false
        Task {
            await pager.refresh()
            stats = try? await repo.stats()
        }
    }

    /// Create a customer, then refresh the list. Returns an error string or nil.
    func create(name: String, phone: String?, notes: String?,
                priceLevelCode: String, standingDiscountPercent: Double) async -> String? {
        await write { try await $0.create(name: name, phone: phone, notes: notes,
                                          priceLevelCode: priceLevelCode,
                                          standingDiscountPercent: standingDiscountPercent) }
    }

    /// Edit a customer, then refresh the list. Returns an error string or nil.
    func update(id: String, name: String, phone: String?, notes: String?,
                priceLevelCode: String, standingDiscountPercent: Double) async -> String? {
        await write { try await $0.update(id, name: name, phone: phone, notes: notes,
                                          priceLevelCode: priceLevelCode,
                                          standingDiscountPercent: standingDiscountPercent) }
    }

    private func write(_ body: (CustomersRepository) async throws -> Void) async -> String? {
        guard let container else { return "not ready" }
        guard container.connectivity.isOnline else { return "offline" }
        do {
            try await body(repo)
            reload()
            return nil
        } catch let error as AppError {
            return error.message
        } catch {
            return error.localizedDescription
        }
    }
}
