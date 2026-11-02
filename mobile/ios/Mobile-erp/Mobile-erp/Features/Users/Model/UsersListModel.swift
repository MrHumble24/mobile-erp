import Foundation
import Observation

/// Loads the user list (load-more paginated via `KitPaginator`) + stats, holds
/// the search/role/status filters, and toggles a user's active state. Reads
/// need `user.manage` (the whole screen is gated on it); the toggle is an
/// online-only write.
@Observable
@MainActor
final class UsersListModel {
    static let pageSize = 25

    var search = ""
    var roleFilter = ""          // "" = all
    var activeFilter = ""        // "", "active", "inactive"

    private(set) var stats: UserStats?
    private(set) var started = false
    var actionError: String?

    @ObservationIgnored private var repo: UsersRepository?
    @ObservationIgnored private var isOnline: (() -> Bool)?
    @ObservationIgnored private var offlineMessage = "needs connection"
    @ObservationIgnored private var searchTask: Task<Void, Never>?

    /// The paginated list. The fetch reads the live filters each page, so a
    /// `refresh()` after a filter change re-queries from page 1.
    @ObservationIgnored lazy var pager = KitPaginator<UserView>(pageSize: Self.pageSize) {
        [weak self] page, size in
        guard let self, let repo = self.repo else { return ([], 0) }
        let resp = try await repo.listPage(
            search: self.search, role: self.roleFilter, active: self.activeBool,
            page: page, pageSize: size)
        return (resp.items, resp.total)
    }

    func bind(_ c: AppContainer) {
        guard repo == nil else { return }
        repo = makeUsersRepository(c)
        isOnline = { c.connectivity.isOnline }
        offlineMessage = c.i18n.t("common.needsConnection",
                                  default: "No connection — try again when you are back online.")
    }

    private var activeBool: Bool? {
        switch activeFilter {
        case "active": return true
        case "inactive": return false
        default: return nil
        }
    }

    func load() async {
        started = true
        await pager.first()
        await loadStats()
    }

    private func loadStats() async {
        stats = try? await repo?.stats()
    }

    /// Debounced search; resets to page 1 on any filter change.
    func onFilterChange() {
        searchTask?.cancel()
        searchTask = Task {
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled else { return }
            await pager.refresh()
            await loadStats()
        }
    }

    func resetFilters() {
        search = ""; roleFilter = ""; activeFilter = ""
        Task { await load() }
    }

    func toggleActive(_ user: UserView) async {
        guard let repo else { return }
        guard isOnline?() ?? false else { actionError = offlineMessage; return }
        actionError = nil
        do {
            _ = try await repo.setActive(user.id, isActive: !user.isActive)
            await load()
        } catch let error as AppError {
            actionError = error.message
        } catch {
            actionError = error.localizedDescription
        }
    }
}
