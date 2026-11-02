import Foundation

/// Loads a partner's ledger and aging buckets — both online-only (`/partners/*`,
/// not in the sync feed). Offline it reports a needs-connection message instead
/// of showing stale data.
@MainActor
@Observable
final class PartnerDetailModel {
    @ObservationIgnored private let repo: PartnerRepository
    @ObservationIgnored private let isOnline: () -> Bool

    private(set) var ledger: [LedgerEntry] = []
    private(set) var aging: [AgingBucket] = []
    private(set) var isLoading = false
    var error: String?

    init(repo: PartnerRepository, isOnline: @escaping () -> Bool) {
        self.repo = repo
        self.isOnline = isOnline
    }

    var hasAging: Bool { aging.contains { $0.count > 0 } }

    func load(partnerId: String) async {
        guard isOnline() else {
            error = "offline"
            return
        }
        isLoading = true
        error = nil
        do {
            async let l = repo.ledger(partnerId)
            async let a = repo.aging(partnerId)
            ledger = try await l
            aging = try await a
        } catch {
            self.error = (error as? AppError)?.message ?? "error"
        }
        isLoading = false
    }
}
