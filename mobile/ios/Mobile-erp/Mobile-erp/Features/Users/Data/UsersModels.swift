import Foundation

/// Domain types for the Users & Access slice, mirroring the web `entities/user`.
/// Admin rows carry no redacted cost fields, so nothing here is cost-optional.

struct UserProfileData: Decodable {
    let firstName: String?
    let lastName: String?
    let phone: String?
    let telegramHandle: String?
    let avatarUrl: String?
    let locale: String?
}

struct UserView: Decodable, Identifiable {
    let id: String
    let email: String
    let isActive: Bool
    let lastLoginAt: String?
    let createdAt: String
    let profile: UserProfileData?
    let roles: [String]

    var displayName: String {
        let name = [profile?.firstName, profile?.lastName]
            .compactMap { $0 }.joined(separator: " ")
        return name.trimmingCharacters(in: .whitespaces).isEmpty ? email : name
    }
}

struct PaginatedUsers: Decodable {
    let items: [UserView]
    let total: Int
    let page: Int
    let pageSize: Int
}

struct UserStats: Decodable {
    let total: Int
    let active: Int
    let byRole: [String: Int]
}

struct RoleView: Decodable, Identifiable {
    let code: String
    let name: String
    let description: String?
    let isSystem: Bool
    let permissionCodes: [String]
    var id: String { code }
}

struct PermissionView: Decodable, Identifiable {
    let code: String
    let resource: String
    let action: String
    let description: String?
    var id: String { code }
}

struct RoleGrant: Decodable {
    let permissionCode: String
    let roleCodes: [String]
}

struct OverrideEntry: Decodable {
    let permissionCode: String
    let granted: Bool
    let reason: String?
}

struct UserPermissionBreakdown: Decodable {
    let roles: [String]
    let roleGrants: [RoleGrant]
    let overrides: [OverrideEntry]
    let effective: [String]
}

// MARK: - Write bodies sent through `container.api` (POST) — clean whitelists.

struct CreateUserProfileDto: Encodable {
    let firstName: String
    let lastName: String?
    let phone: String?
    let telegramHandle: String?
}

struct CreateUserDto: Encodable {
    let email: String
    let password: String
    let profile: CreateUserProfileDto
    let roleCodes: [String]
}

struct ResetPasswordDto: Encodable {
    let password: String
}

struct CreateRoleDto: Encodable {
    let code: String
    let name: String
    let description: String?
}

/// Permissions grouped by resource, resources sorted — stable order for the
/// matrix editors. Mirrors the web `groupByResource`.
func groupByResource(_ perms: [PermissionView]) -> [(resource: String, items: [PermissionView])] {
    let groups = Dictionary(grouping: perms, by: { $0.resource })
    return groups.keys.sorted().map { (resource: $0, items: groups[$0] ?? []) }
}
