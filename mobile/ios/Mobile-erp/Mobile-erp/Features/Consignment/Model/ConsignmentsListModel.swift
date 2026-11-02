import Foundation
import SwiftData

/// Drives the consignments list: filters + pagination, the online list/stats
/// fetch (consignments are not cached, so offline shows a needs-connection
/// state), and the count of queued-but-unsynced lifecycle writes for the
/// pending-sync marker.
@MainActor
@Observable
final class ConsignmentsListModel {
    @ObservationIgnored private let repo: ConsignmentRepository
    @ObservationIgnored private let isOnline: () -> Bool
    @ObservationIgnored private let context: ModelContext

    private(set) var page: ConsignmentPage?
    private(set) var stats: ConsignmentStats?
    private(set) var isLoading = false
    private(set) var offline = false
    var error: String?

    var search = ""
    var status: ConsignmentStatusFilter = .all
    var preset: RangePreset = .all
    var customFrom = ""
    var customTo = ""
    var pageIndex = 1
    let pageSize = 25

    init(repo: ConsignmentRepository, context: ModelContext, isOnline: @escaping () -> Bool) {
        self.repo = repo
        self.context = context
        self.isOnline = isOnline
    }

    private var query: ConsignmentQuery {
        let b = ConsignmentLogic.bounds(preset, from: customFrom, to: customTo)
        var q = ConsignmentQuery()
        q.status = status
        q.search = search
        q.fromDate = b.from
        q.toDate = b.to
        q.page = pageIndex
        q.pageSize = pageSize
        return q
    }

    func load() async {
        guard isOnline() else {
            offline = true
            page = nil
            stats = nil
            return
        }
        offline = false
        isLoading = true
        error = nil
        let q = query
        do {
            async let list = repo.list(q)
            async let st = repo.stats(q)
            page = try await list
            stats = try await st
        } catch {
            self.error = (error as? AppError)?.message ?? "error"
        }
        isLoading = false
    }

    func reset() {
        search = ""
        status = .all
        preset = .all
        customFrom = ""
        customTo = ""
        pageIndex = 1
    }

    var items: [Consignment] { page?.items ?? [] }
    var total: Int { page?.total ?? 0 }
    var totalPages: Int { max(1, Int(ceil(Double(total) / Double(pageSize)))) }

    func setPage(_ p: Int) async {
        pageIndex = min(max(1, p), totalPages)
        await load()
    }

    /// Queued consignment writes not yet confirmed by the server.
    var pendingCount: Int {
        let pending = (try? context.fetch(FetchDescriptor<OutboxEntry>(
            predicate: #Predicate { $0.status == "pending" }))) ?? []
        return pending.filter { $0.type.hasPrefix("consignment") }.count
    }
}
