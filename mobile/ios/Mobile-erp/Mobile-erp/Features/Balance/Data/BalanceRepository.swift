import Foundation

/// The only place that talks to `/ledger`. All reads online; writes are
/// online-only (ledger entries are never queued in the offline outbox — the
/// caller gates on connectivity first). Filters/paging arrive as a ready query
/// dictionary built by the screen model.
@MainActor
struct BalanceRepository {
    let api: APIClient

    func balances() async throws -> BalanceSummary {
        try await api.get("/ledger/balances")
    }

    func transactions(_ params: [String: String]) async throws -> BalanceTransactionPage {
        try await api.get("/ledger/transactions", query: params)
    }

    func createTransaction(_ dto: CreateLedgerTransactionDto) async throws {
        try await api.postVoid("/ledger/transactions", body: dto)
    }

    func createTransfer(_ dto: CreateLedgerTransferDto) async throws {
        try await api.postVoid("/ledger/transfers", body: dto)
    }
}
