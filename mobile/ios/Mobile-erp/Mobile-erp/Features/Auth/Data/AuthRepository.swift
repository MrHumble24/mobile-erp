import Foundation

/// The only place that talks to the `/auth/*` endpoints.
@MainActor
struct AuthRepository {
    let api: APIClient

    func login(email: String, password: String) async throws -> LoginResponse {
        try await api.post("/auth/login", body: LoginRequest(email: email, password: password))
    }

    func me() async throws -> AuthUser {
        try await api.get("/auth/me")
    }

    private struct LoginRequest: Encodable {
        let email: String
        let password: String
    }
}
