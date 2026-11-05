import Foundation
import Observation

/// Customer-purchases list state (ADR 0039): an optional date range, a server
/// search by IMEI/serial and the loaded rows. Reads are online-only (buying is
/// online only); offline shows a note.
@MainActor
@Observable
final class PurchasesListModel {
    var search = ""
    var from: Date?
    var to: Date?
    private(set) var items: [CustomerPurchaseView] = []
    private(set) var total = 0
    private(set) var loading = false
    var error: String?
    var offline = false

    /// One generous page — the shop buys a handful of phones a day; infinite
    /// scroll can come later if the history grows.
    private let pageSize = 50

    @ObservationIgnored private var container: AppContainer?
    private var repo: PurchasesRepository { PurchasesRepository(api: container!.api) }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    var hasFilter: Bool { from != nil || to != nil }

    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else { offline = true; return }
        offline = false
        loading = true
        error = nil
        Task {
            defer { loading = false }
            do {
                let page = try await repo.list(from: from, to: to, search: search,
                                               page: 1, pageSize: pageSize)
                items = page.items
                total = page.total
            } catch let e as AppError { error = e.message }
            catch { self.error = error.localizedDescription }
        }
    }
}
