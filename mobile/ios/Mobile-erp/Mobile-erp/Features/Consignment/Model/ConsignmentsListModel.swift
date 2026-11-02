import Foundation
import SwiftData

/// Drives the consignments list: filters + load-more pagination (`KitPaginator`),
/// the online list/stats fetch (consignments are not cached, so offline shows a
/// needs-connection state), and the count of queued-but-unsynced lifecycle
/// writes for the pending-sync marker.
@MainActor
@Observable
final class ConsignmentsListModel {
    @ObservationIgnored private let repo: ConsignmentRepository
    @ObservationIgnored private let isOnline: () -> Bool
    @ObservationIgnored private let context: ModelContext

    private(set) var stats: ConsignmentStats?
    private(set) var offline = false
    var error: String?

    var search = ""
    var status: ConsignmentStatusFilter = .all
    var preset: RangePreset = .all
    var customFrom = ""
    var customTo = ""
    let pageSize = 25

    init(repo: ConsignmentRepository, context: ModelContext, isOnline: @escaping () -> Bool) {
        self.repo = repo
        self.context = context
        self.isOnline = isOnline
    }

    /// Server query from the current filters; `page`/`pageSize` are set per page
    /// by the paginator.
    private var query: ConsignmentQuery {
        let b = ConsignmentLogic.bounds(preset, from: customFrom, to: customTo)
        var q = ConsignmentQuery()
        q.status = status
        q.search = search
        q.fromDate = b.from
        q.toDate = b.to
        return q
    }

    @ObservationIgnored lazy var pager = KitPaginator<Consignment>(pageSize: pageSize) {
        [weak self] page, size in
        guard let self, self.isOnline() else { return ([], 0) }
        var q = self.query
        q.page = page
        q.pageSize = size
        let result = try await self.repo.list(q)
        return (result.items, result.total)
    }

    func load() async {
        error = nil
        guard isOnline() else {
            offline = true
            stats = nil
            await pager.first()   // fetch returns empty while offline
            return
        }
        offline = false
        await pager.first()
        if let message = pager.error { error = message }
        stats = try? await repo.stats(query)
    }

    func reset() {
        search = ""
        status = .all
        preset = .all
        customFrom = ""
        customTo = ""
    }

    var items: [Consignment] { pager.items }

    /// Queued consignment writes not yet confirmed by the server.
    var pendingCount: Int {
        let pending = (try? context.fetch(FetchDescriptor<OutboxEntry>(
            predicate: #Predicate { $0.status == "pending" }))) ?? []
        return pending.filter { $0.type.hasPrefix("consignment") }.count
    }
}
