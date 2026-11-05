import Foundation
import Observation

/// Repairs list state (ADR 0040): a status filter, a server search (ticket
/// number / IMEI / serial / customer) and the rows. Online only; offline and the
/// "repairs off" 403 both show a note.
@MainActor
@Observable
final class RepairsListModel {
    /// nil = all statuses.
    var status: String?
    var search = ""
    private(set) var items: [RepairListItem] = []
    private(set) var total = 0
    private(set) var loading = false
    var error: String?
    var offline = false
    var disabled = false

    private let pageSize = 50

    @ObservationIgnored private var container: AppContainer?
    private var repo: RepairsRepository { RepairsRepository(api: container!.api) }

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
        disabled = false
        Task {
            defer { loading = false }
            do {
                let page = try await repo.list(status: status, from: nil, to: nil,
                                               search: search, page: 1, pageSize: pageSize)
                items = page.items
                total = page.total
            } catch let e as AppError {
                if e.code == "REPAIRS_DISABLED" { disabled = true } else { error = e.message }
            } catch { self.error = error.localizedDescription }
        }
    }
}
