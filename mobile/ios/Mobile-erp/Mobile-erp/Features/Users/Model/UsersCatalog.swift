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
    @ObservationIgnored private var i18n: I18n?

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
        i18n = c.i18n
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
        } catch { actionError = deleteMessage(error); return false }
    }

    private func message(_ error: Error) -> String {
        (error as? AppError)?.message ?? error.localizedDescription
    }

    /// A 409 means the role is still assigned; show the counted message the web
    /// shows (`users.roleInUse`), not the raw server sentence.
    private func deleteMessage(_ error: Error) -> String {
        guard let e = error as? AppError, e.statusCode == 409, let i18n else {
            return message(error)
        }
        // ponytail: count parsed from the server message ("assigned to N user(s)");
        // read a structured `assignedUsers` field instead if that text ever changes.
        let count = e.message.firstInteger ?? 0
        return i18n.t("users.roleInUse", ["count": String(count)])
    }
}

/// Builds a slice repository from the container (used by every Users model).
@MainActor
func makeUsersRepository(_ c: AppContainer) -> UsersRepository {
    UsersRepository(api: c.api)
}

private extension String {
    /// First run of digits in the string as an Int, or nil. Used to pull the
    /// assigned-user count out of the role-in-use conflict message.
    var firstInteger: Int? {
        let digits = drop { !$0.isNumber }.prefix { $0.isNumber }
        return Int(digits)
    }
}
