import Foundation
import Observation

/// Customer directory state: search text + sort + the loaded page. Reads are
/// online-only; offline shows a needs-connection note.
@MainActor
@Observable
final class CustomersModel {
    var search = ""
    var hasPurchasesOnly = false
    var sort = "recent"      // "recent" | "name"
    var page: CustomerPage?
    var loading = false
    var errorMessage: String?
    var offline = false

    @ObservationIgnored private var container: AppContainer?
    private var repo: CustomersRepository { CustomersRepository(api: container!.api) }

    var canManage: Bool { container?.session.can("customer.manage") ?? false }
    var isOnline: Bool { container?.connectivity.isOnline ?? false }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else {
            offline = true
            page = nil
            return
        }
        offline = false
        loading = true
        errorMessage = nil
        let (search, hasPurchases, sort) = (self.search, hasPurchasesOnly ? true : nil, self.sort)
        Task {
            do {
                page = try await repo.page(search: search, hasPurchases: hasPurchases, sort: sort)
            } catch let error as AppError {
                errorMessage = error.message
            } catch {
                errorMessage = error.localizedDescription
            }
            loading = false
        }
    }

    /// Create a customer, then refresh the list. Returns an error string or nil.
    func create(name: String, phone: String?, notes: String?) async -> String? {
        guard let container else { return "not ready" }
        guard container.connectivity.isOnline else { return "offline" }
        do {
            try await repo.create(name: name, phone: phone, notes: notes)
            reload()
            return nil
        } catch let error as AppError {
            return error.message
        } catch {
            return error.localizedDescription
        }
    }

    /// Edit a customer, then refresh the list. Returns an error string or nil.
    func update(id: String, name: String, phone: String?, notes: String?) async -> String? {
        guard let container else { return "not ready" }
        guard container.connectivity.isOnline else { return "offline" }
        do {
            try await repo.update(id, name: name, phone: phone, notes: notes)
            reload()
            return nil
        } catch let error as AppError {
            return error.message
        } catch {
            return error.localizedDescription
        }
    }
}
