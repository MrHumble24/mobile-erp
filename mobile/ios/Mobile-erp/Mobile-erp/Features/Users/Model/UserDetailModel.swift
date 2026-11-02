import Foundation
import Observation

/// Drives one user's detail sheet: profile edit, role assignment, permission
/// overrides, password reset and active toggle. Every write is online-only
/// (none are outbox types). Self-edits of roles/permissions/deactivation are
/// locked, matching the web.
@Observable
@MainActor
final class UserDetailModel {
    let userId: String
    let isSelf: Bool

    private(set) var user: UserView?
    private(set) var breakdown: UserPermissionBreakdown?
    private(set) var loading = true
    var error: String?
    var saved: String?

    // Profile draft.
    var firstName = ""
    var lastName = ""
    var phone = ""
    var telegramHandle = ""
    var locale = "uz"

    // Role + override drafts.
    var selectedRoles: [String] = []
    var overrides: [String: OverrideState] = [:]
    private var initialOverrides: [String: OverrideState] = [:]

    @ObservationIgnored private var repo: UsersRepository?
    @ObservationIgnored private var isOnline: (() -> Bool)?
    @ObservationIgnored private var offlineMessage = "needs connection"

    init(userId: String, isSelf: Bool) {
        self.userId = userId
        self.isSelf = isSelf
    }

    func bind(_ c: AppContainer) {
        guard repo == nil else { return }
        repo = makeUsersRepository(c)
        isOnline = { c.connectivity.isOnline }
        offlineMessage = c.i18n.t("common.needsConnection",
                                  default: "No connection — try again when you are back online.")
    }

    var rolesDirty: Bool {
        guard let user else { return false }
        return Set(selectedRoles) != Set(user.roles)
    }

    var overridesDirty: Bool {
        OverrideMatrix.isDirty(initial: initialOverrides, current: overrides)
    }

    func load() async {
        guard let repo else { return }
        loading = true
        error = nil
        defer { loading = false }
        do {
            let user = try await repo.get(userId)
            self.user = user
            firstName = user.profile?.firstName ?? ""
            lastName = user.profile?.lastName ?? ""
            phone = user.profile?.phone ?? ""
            telegramHandle = user.profile?.telegramHandle ?? ""
            locale = user.profile?.locale ?? "uz"
            selectedRoles = user.roles
            if let breakdown = try? await repo.effectivePermissions(userId) {
                self.breakdown = breakdown
                initialOverrides = OverrideMatrix.initial(from: breakdown.overrides)
                overrides = initialOverrides
            }
        } catch let error as AppError {
            self.error = error.message
        } catch {
            self.error = error.localizedDescription
        }
    }

    func roleGrantCodes(for permission: String) -> [String] {
        breakdown?.roleGrants.first { $0.permissionCode == permission }?.roleCodes ?? []
    }

    private func online() -> Bool {
        if isOnline?() ?? false { return true }
        error = offlineMessage
        return false
    }

    func saveProfile(savedMessage: String) async {
        guard let repo, online() else { return }
        error = nil; saved = nil
        let profile: [String: Any] = [
            "firstName": firstName, "lastName": lastName, "phone": phone,
            "telegramHandle": telegramHandle, "locale": locale,
        ]
        await run(savedMessage) { self.user = try await repo.updateProfile(self.userId, profile: profile) }
    }

    func saveRoles(savedMessage: String) async {
        guard let repo, online() else { return }
        await run(savedMessage) {
            self.user = try await repo.setRoles(self.userId, roleCodes: self.selectedRoles)
        }
    }

    func saveOverrides(savedMessage: String) async {
        guard let repo, online() else { return }
        await run(savedMessage) {
            self.user = try await repo.setPermissions(
                self.userId, overrides: OverrideMatrix.payload(self.overrides))
            self.initialOverrides = self.overrides
        }
    }

    func resetPassword(_ password: String, savedMessage: String) async {
        guard let repo, online() else { return }
        await run(savedMessage) { try await repo.resetPassword(self.userId, password: password) }
    }

    func toggleActive(savedMessage: String) async {
        guard let repo, let user, online() else { return }
        await run(savedMessage) {
            self.user = try await repo.setActive(self.userId, isActive: !user.isActive)
        }
    }

    private func run(_ savedMessage: String, _ body: () async throws -> Void) async {
        error = nil; saved = nil
        do {
            try await body()
            saved = savedMessage
        } catch let error as AppError {
            self.error = error.message
        } catch {
            self.error = error.localizedDescription
        }
    }

    func toggleRole(_ code: String) {
        if let i = selectedRoles.firstIndex(of: code) { selectedRoles.remove(at: i) }
        else { selectedRoles.append(code) }
    }
}
