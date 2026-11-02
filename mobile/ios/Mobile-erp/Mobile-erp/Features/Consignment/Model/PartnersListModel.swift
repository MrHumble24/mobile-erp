import Foundation

/// Drives the partner directory: loads the list (online full data, else the
/// offline mirror), holds the search / status / overdue filters and derives the
/// summary tiles. Server state only flows through here — views read `filtered`.
@MainActor
@Observable
final class PartnersListModel {
    enum ActiveFilter: String, CaseIterable, Identifiable {
        case all, active, inactive
        var id: String { rawValue }
    }

    @ObservationIgnored private let repo: PartnerRepository
    @ObservationIgnored private let isOnline: () -> Bool

    private(set) var partners: [Partner] = []
    private(set) var isLoading = false
    private(set) var offline = false
    var error: String?

    var search = ""
    var active: ActiveFilter = .all
    var overdueOnly = false

    init(repo: PartnerRepository, isOnline: @escaping () -> Bool) {
        self.repo = repo
        self.isOnline = isOnline
    }

    func load() async {
        isLoading = true
        error = nil
        if isOnline() {
            do {
                partners = try await repo.listOnline()
                offline = false
            } catch {
                partners = repo.listCached()
                offline = true
                self.error = (error as? AppError)?.message
            }
        } else {
            partners = repo.listCached()
            offline = true
        }
        isLoading = false
    }

    func reset() {
        search = ""
        active = .all
        overdueOnly = false
    }

    var filtered: [Partner] {
        partners.filter { p in
            if !matchesSearch(p) { return false }
            switch active {
            case .active where !p.isActive: return false
            case .inactive where p.isActive: return false
            default: break
            }
            if overdueOnly && (p.overdueCount ?? 0) == 0 { return false }
            return true
        }
    }

    private func matchesSearch(_ p: Partner) -> Bool {
        let term = search.trimmingCharacters(in: .whitespaces).lowercased()
        guard !term.isEmpty else { return true }
        return [p.shopName, p.phone, p.contactPerson]
            .compactMap { $0?.lowercased() }
            .contains { $0.contains(term) }
    }

    // MARK: - Summary tiles (from the filtered list, as the web does)

    var devicesOut: Int { filtered.reduce(0) { $0 + ($1.openCount ?? 0) } }
    var overdue: Int { filtered.reduce(0) { $0 + ($1.overdueCount ?? 0) } }
    var outstanding: String {
        let sum = filtered.reduce(Decimal.zero) { $0 + (Decimal(string: $1.outstanding) ?? .zero) }
        return NSDecimalNumber(decimal: sum).stringValue
    }
}
