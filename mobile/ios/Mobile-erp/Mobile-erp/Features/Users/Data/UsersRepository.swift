import Foundation

/// The only place the Users & Access slice talks HTTP. All verbs go through the
/// shared `APIClient` (its `patchJSON`/`putJSON` send `[String: Any]` bodies so
/// an admin write can clear a field). `/users/*` needs `user.manage`,
/// `/access/*` needs `role.manage` — the server enforces both.
@MainActor
struct UsersRepository {
    let api: APIClient

    // MARK: Users

    func listPage(search: String?, role: String?, active: Bool?,
                  page: Int, pageSize: Int) async throws -> PaginatedUsers {
        var query: [String: String] = ["page": String(page), "pageSize": String(pageSize)]
        if let search, !search.isEmpty { query["search"] = search }
        if let role, !role.isEmpty { query["role"] = role }
        if let active { query["active"] = String(active) }
        return try await api.get("/users", query: query)
    }

    func stats() async throws -> UserStats {
        try await api.get("/users/stats")
    }

    func get(_ id: String) async throws -> UserView {
        try await api.get("/users/\(id)")
    }

    func effectivePermissions(_ id: String) async throws -> UserPermissionBreakdown {
        try await api.get("/users/\(id)/effective-permissions")
    }

    func create(_ dto: CreateUserDto) async throws -> UserView {
        try await api.post("/users", body: dto)
    }

    func resetPassword(_ id: String, password: String) async throws {
        try await api.postVoid("/users/\(id)/password", body: ResetPasswordDto(password: password))
    }

    func updateProfile(_ id: String, profile: [String: Any]) async throws -> UserView {
        try await api.patchJSON("/users/\(id)", ["profile": profile])
    }

    func setActive(_ id: String, isActive: Bool) async throws -> UserView {
        try await api.patchJSON("/users/\(id)", ["isActive": isActive])
    }

    func setRoles(_ id: String, roleCodes: [String]) async throws -> UserView {
        try await api.putJSON("/users/\(id)/roles", ["roleCodes": roleCodes])
    }

    func setPermissions(_ id: String, overrides: [[String: Any]]) async throws -> UserView {
        try await api.putJSON("/users/\(id)/permissions", ["overrides": overrides])
    }

    // MARK: Access (roles + permissions)

    func listRoles() async throws -> [RoleView] {
        try await api.get("/access/roles")
    }

    func listPermissions() async throws -> [PermissionView] {
        try await api.get("/access/permissions")
    }

    func createRole(_ dto: CreateRoleDto) async throws -> RoleView {
        try await api.post("/access/roles", body: dto)
    }

    func renameRole(_ code: String, name: String, description: String) async throws -> RoleView {
        try await api.patchJSON("/access/roles/\(code)", ["name": name, "description": description])
    }

    func setRolePermissions(_ code: String, permissionCodes: [String]) async throws -> RoleView {
        try await api.putJSON("/access/roles/\(code)/permissions", ["permissionCodes": permissionCodes])
    }

    func deleteRole(_ code: String) async throws {
        try await api.delete("/access/roles/\(code)")
    }
}
