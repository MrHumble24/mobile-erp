import Foundation
import Observation

/// Shifts list state (ADR 0036): newest first, a date range, and a cashier filter
/// that only a `shift.manage` user may set (the server forces own-only otherwise).
/// Reads are online-only; offline shows a note.
@MainActor
@Observable
final class ShiftsListModel {
    var filters = ShiftListFilters()
    var offline = false

    private(set) var pager: KitPaginator<ShiftListItem>!

    @ObservationIgnored private var container: AppContainer?
    private var repo: ShiftRepository { ShiftRepository(api: container!.api) }

    var canManage: Bool { container?.session.can("shift.manage") ?? false }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        pager = KitPaginator<ShiftListItem>(pageSize: 20) { [weak self] page, size in
            guard let self else { return ([], 0) }
            let result = try await self.repo.list(self.filters, page: page, pageSize: size)
            return (result.items, result.total)
        }
    }

    func reload() {
        guard let container else { return }
        guard container.connectivity.isOnline else { offline = true; return }
        offline = false
        Task { await pager.refresh() }
    }
}
