import Foundation
import Observation

/// The four manual transaction kinds (transfer is its own endpoint). Opening and
/// correction take a **signed** amount; deposit and withdraw take a positive one
/// (the server derives the sign from the type). Correction requires a note.
enum BalanceEntryKind: String, Identifiable {
    case opening, deposit, withdraw, correction
    var id: String { rawValue }

    var typeCode: String {
        switch self {
        case .opening: "OPENING"
        case .deposit: "DEPOSIT"
        case .withdraw: "WITHDRAWAL"
        case .correction: "CORRECTION"
        }
    }
    var titleKey: String {
        switch self {
        case .opening: "balance.setOpening"
        case .deposit: "balance.deposit"
        case .withdraw: "balance.withdraw"
        case .correction: "balance.correction"
        }
    }
    var signed: Bool { self == .opening || self == .correction }
    var requiresNote: Bool { self == .correction }
    var noteKey: String { self == .correction ? "balance.reason" : "balance.note" }
    var hintKey: String? {
        switch self {
        case .opening: "balance.openingHint"
        case .correction: "balance.correctionHint"
        default: nil
        }
    }
}

/// Screen state for the store-balance screen: the two account balances + total,
/// the paginated history, and the client-only filters. One reason to change —
/// the balance screen. Every write is online-only; the sheet checks connectivity
/// before calling, and a write reloads both balances and history.
@Observable
@MainActor
final class BalanceModel {
    // Filters (client state).
    var accountCode: String?
    var typeCode: String?
    var range = KitDateRange.all

    private(set) var summary: BalanceSummary?
    private(set) var pager: KitPaginator<BalanceTransaction>?

    @ObservationIgnored private var repo: BalanceRepository?

    var accounts: [BalanceAccount] { summary?.accounts ?? [] }

    func bind(_ container: AppContainer) {
        guard repo == nil else { return }
        let repo = BalanceRepository(api: container.api)
        self.repo = repo
        pager = KitPaginator<BalanceTransaction> { [weak self] page, size in
            guard let self else { return ([], 0) }
            var q = self.queryParams()
            q["page"] = String(page)
            q["pageSize"] = String(size)
            let resp = try await repo.transactions(q)
            return (resp.items, resp.total)
        }
    }

    func load() async { await reload() }

    /// Re-fetch balances + first history page after a filter change or a write.
    func reload() async {
        summary = try? await repo?.balances()
        await pager?.refresh()
    }

    // MARK: writes

    func createEntry(_ dto: CreateLedgerTransactionDto) async throws {
        try await repo?.createTransaction(dto)
        await reload()
    }

    func createTransfer(_ dto: CreateLedgerTransferDto) async throws {
        try await repo?.createTransfer(dto)
        await reload()
    }

    // MARK: query mapping

    private func queryParams() -> [String: String] {
        var q: [String: String] = [:]
        let (from, to) = isoBounds()
        if let from { q["from"] = from }
        if let to { q["to"] = to }
        if let accountCode { q["accountCode"] = accountCode }
        if let typeCode { q["typeCode"] = typeCode }
        return q
    }

    /// Instants bounding the user's local day (never a bare date — that would make
    /// "today" an empty range on the server).
    private func isoBounds() -> (String?, String?) {
        let cal = Calendar.current
        let iso = ISO8601DateFormatter()
        let from = range.from.map { iso.string(from: cal.startOfDay(for: $0)) }
        let to = range.to.map { date -> String in
            let end = cal.date(bySettingHour: 23, minute: 59, second: 59, of: date) ?? date
            return iso.string(from: end)
        }
        return (from, to)
    }
}
