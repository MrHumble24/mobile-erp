import Foundation
import Observation

/// Loads the paginated user list + stats, holds the search/role/status filters,
/// and toggles a user's active state. Reads need `user.manage` (the whole
/// screen is gated on it); the toggle is an online-only write.
@Observable
@MainActor
final class UsersListModel {
    static let pageSize = 25

    var search = ""
    var roleFilter = ""          // "" = all
    var activeFilter = ""        // "", "active", "inactive"
    private(set) var page = 1

    private(set) var data: PaginatedUsers?
    private(set) var stats: UserStats?
    private(set) var loading = false
    private(set) var loadError: AppError?
    var actionError: String?

    @ObservationIgnored private var repo: UsersRepository?
    @ObservationIgnored private var isOnline: (() -> Bool)?
    @ObservationIgnored private var offlineMessage = "needs connection"
    @ObservationIgnored private var searchTask: Task<Void, Never>?

    func bind(_ c: AppContainer) {
        guard repo == nil else { return }
        repo = makeUsersRepository(c)
        isOnline = { c.connectivity.isOnline }
        offlineMessage = c.i18n.t("common.needsConnection",
                                  default: "No connection — try again when you are back online.")
    }

    var total: Int { data?.total ?? 0 }
    var hasPrev: Bool { page > 1 }
    var hasNext: Bool { page * Self.pageSize < total }

    private var activeBool: Bool? {
        switch activeFilter {
        case "active": return true
        case "inactive": return false
        default: return nil
        }
    }

    func load() async {
        guard let repo else { return }
        loading = true
        loadError = nil
        defer { loading = false }
        do {
            async let list = repo.listPage(
                search: search, role: roleFilter, active: activeBool,
                page: page, pageSize: Self.pageSize)
            async let stats = repo.stats()
            data = try await list
            self.stats = try? await stats
        } catch let error as AppError {
            loadError = error
        } catch {
            loadError = AppError(statusCode: 0, message: error.localizedDescription)
        }
    }

    /// Debounced search; resets to page 1 on any filter change.
    func onFilterChange() {
        searchTask?.cancel()
        searchTask = Task {
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled else { return }
            page = 1
            await load()
        }
    }

    func setPage(_ next: Int) {
        page = max(1, next)
        Task { await load() }
    }

    func resetFilters() {
        search = ""; roleFilter = ""; activeFilter = ""; page = 1
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
