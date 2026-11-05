import Foundation
import Observation

/// Credits list state (ADR 0035): the status filter (all / open / overdue / paid
/// in full), a client-side name/phone search and the loaded rows. Reads are
/// online-only (credit is online only); offline shows a note.
@MainActor
@Observable
final class CreditsListModel {
    var status: CreditStatusFilter = .all
    var search = ""
    private(set) var credits: [CreditListItem] = []
    private(set) var loading = false
    var error: String?
    var offline = false

    @ObservationIgnored private var container: AppContainer?
    private var repo: CreditRepository { CreditRepository(api: container!.api) }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    /// Rows after the local name/phone search filter.
    var rows: [CreditListItem] {
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return credits }
        return credits.filter {
            $0.customer.name.lowercased().contains(q)
                || ($0.customer.phone ?? "").lowercased().contains(q)
        }
    }

    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else { offline = true; return }
        offline = false
        loading = true
        error = nil
        Task {
            defer { loading = false }
            do { credits = try await repo.list(status: status) }
            catch let e as AppError { error = e.message }
            catch { self.error = error.localizedDescription }
        }
    }
}
