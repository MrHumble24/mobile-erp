import Foundation
import Observation

/// Shared reference data for the slice: the role list and the permission
/// catalogue, loaded once and reused by the users list, the role editor and the
/// permission matrices. Also owns role CRUD (all `role.manage`, online-only).
@Observable
@MainActor
final class UsersCatalog {
    private(set) var roles: [RoleView] = []
    private(set) var permissions: [PermissionView] = []
    private(set) var loaded = false
    var actionError: String?

    @ObservationIgnored private var repo: UsersRepository?
    @ObservationIgnored private var isOnline: (() -> Bool)?
    @ObservationIgnored private var offlineMessage = "needs connection"
    @ObservationIgnored private var canRoleManage = false

    func bind(_ c: AppContainer) {
        guard repo == nil else { return }
        #if DEBUG
        runUsersSelfChecks()
        #endif
        repo = makeUsersRepository(c)
        isOnline = { c.connectivity.isOnline }
        offlineMessage = c.i18n.t("common.needsConnection",
                                  default: "No connection — try again when you are back online.")
        canRoleManage = c.session.can("role.manage")
    }

    /// Roles and permissions are only reachable with `role.manage`; without it
    /// the editors are hidden, so we skip the (403-bound) fetch entirely.
    var canManageRoles: Bool { canRoleManage }

    func loadIfNeeded() async {
        guard !loaded, canRoleManage else { return }
        await reload()
    }

    func reload() async {
        guard let repo, canRoleManage else { return }
        async let roles = repo.listRoles()
        async let permissions = repo.listPermissions()
        if let r = try? await roles { self.roles = r }
        if let p = try? await permissions { self.permissions = p }
        loaded = true
    }

    func roleName(_ code: String) -> String {
        roles.first { $0.code == code }?.name ?? code
    }

    private func guardedOnline() -> Bool {
        if isOnline?() ?? false { return true }
        actionError = offlineMessage
        return false
    }

    @discardableResult
    func createRole(code: String, name: String, description: String) async -> Bool {
        guard let repo, guardedOnline() else { return false }
        actionError = nil
        do {
            _ = try await repo.createRole(CreateRoleDto(
                code: code, name: name, description: description.isEmpty ? nil : description))
            await reload()
            return true
        } catch { actionError = message(error); return false }
    }

    @discardableResult
    func renameRole(_ code: String, name: String, description: String) async -> Bool {
        guard let repo, guardedOnline() else { return false }
        actionError = nil
        do {
            _ = try await repo.renameRole(code, name: name, description: description)
            await reload()
            return true
        } catch { actionError = message(error); return false }
    }

    @discardableResult
    func setRolePermissions(_ code: String, permissionCodes: [String]) async -> Bool {
        guard let repo, guardedOnline() else { return false }
        actionError = nil
        do {
            _ = try await repo.setRolePermissions(code, permissionCodes: permissionCodes)
            await reload()
            return true
        } catch { actionError = message(error); return false }
    }

    @discardableResult
    func deleteRole(_ code: String) async -> Bool {
        guard let repo, guardedOnline() else { return false }
        actionError = nil
        do {
            try await repo.deleteRole(code)
            await reload()
            return true
        } catch { actionError = message(error); return false }
    }

    private func message(_ error: Error) -> String {
        (error as? AppError)?.message ?? error.localizedDescription
    }
}

/// Builds a slice repository from the container (used by every Users model).
@MainActor
func makeUsersRepository(_ c: AppContainer) -> UsersRepository {
    UsersRepository(api: c.api)
}
