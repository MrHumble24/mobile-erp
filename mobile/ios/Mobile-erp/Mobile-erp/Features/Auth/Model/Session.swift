import Foundation
import Observation

/// Single source of truth for the signed-in session. `user` is nil when logged
/// out. The 12h JWT and the cached user live in the keychain; this restores
/// them at launch (rejecting an expired token so it isn't used offline),
/// persists them on login, and clears both on logout or a 401.
///
/// Gating is by permission *code* via `can(_:)` — never by role name.
@Observable
@MainActor
final class Session {
    private(set) var user: AuthUser?
    private(set) var isRestoring = true
    var loginError: AppError?
    var isLoggingIn = false

    @ObservationIgnored private let repo: AuthRepository
    @ObservationIgnored private let keychain: Keychain
    /// Called after a successful login (the container wires this to sync).
    @ObservationIgnored var onLogin: (() -> Void)?

    init(repo: AuthRepository, keychain: Keychain) {
        self.repo = repo
        self.keychain = keychain
        restore()
    }

    var isAuthenticated: Bool { user != nil }

    func can(_ code: String) -> Bool { user?.permissions.contains(code) ?? false }

    func restore() {
        defer { isRestoring = false }
        guard let token = keychain.string(.token), !token.isEmpty,
              let userJSON = keychain.string(.user),
              !isJWTExpired(token),
              let data = userJSON.data(using: .utf8),
              let decoded = try? JSONDecoder().decode(AuthUser.self, from: data)
        else {
            clear()
            return
        }
        user = decoded
    }

    func login(email: String, password: String) async {
        isLoggingIn = true
        loginError = nil
        defer { isLoggingIn = false }
        do {
            let result = try await repo.login(email: email, password: password)
            keychain.set(result.accessToken, for: .token)
            if let data = try? JSONEncoder().encode(result.user) {
                keychain.set(String(decoding: data, as: UTF8.self), for: .user)
            }
            user = result.user
            AppLog.info("auth", "login ok: \(result.user.displayName)")
            onLogin?()   // hydrate the cache
        } catch let error as AppError {
            AppLog.warn("auth", "login failed: \(error.statusCode) \(error.message)")
            loginError = error
        } catch {
            AppLog.warn("auth", "login failed: \(error.localizedDescription)")
            loginError = AppError(statusCode: 0, message: error.localizedDescription)
        }
    }

    func logout() {
        AppLog.info("auth", "logout")
        clear()
    }

    func clear() {
        keychain.delete(.token)
        keychain.delete(.user)
        user = nil
        // Drop cached GET responses so the next user can't read them offline.
        URLCache.shared.removeAllCachedResponses()
    }

    var hasToken: Bool {
        (keychain.string(.token).map { !$0.isEmpty }) ?? false
    }
}
