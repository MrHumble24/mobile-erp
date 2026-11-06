import Foundation

struct UserStore: Codable, Identifiable, Hashable {
    let id: String
    let name: String
}

/// Authenticated user as returned by `/auth/login` (inside `user`) and
/// `/auth/me`. Permission *codes* — never role names — drive all gating.
struct AuthUser: Codable {
    let id: String
    let email: String
    let profile: AuthProfile?
    let roles: [String]
    let permissions: [String]
    let stores: [UserStore]

    enum CodingKeys: String, CodingKey { case id, email, profile, roles, permissions, stores }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        email = try c.decode(String.self, forKey: .email)
        profile = try? c.decodeIfPresent(AuthProfile.self, forKey: .profile)
        roles = (try? c.decodeIfPresent([String].self, forKey: .roles)) ?? []
        permissions = (try? c.decodeIfPresent([String].self, forKey: .permissions)) ?? []
        stores = (try? c.decodeIfPresent([UserStore].self, forKey: .stores)) ?? []
    }

    var displayName: String {
        let name = [profile?.firstName, profile?.lastName]
            .compactMap { $0 }.joined(separator: " ")
        return name.isEmpty ? email : name
    }
}

struct AuthProfile: Codable {
    let firstName: String?
    let lastName: String?
    let phone: String?
}

/// `/auth/login` response: a bare access token (no refresh) + the user.
struct LoginResponse: Decodable {
    let accessToken: String
    let user: AuthUser
}
