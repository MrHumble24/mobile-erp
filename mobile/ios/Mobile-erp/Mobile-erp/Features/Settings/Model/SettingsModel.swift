import Foundation
import Observation

/// Loads store settings, edits them in a form draft, and saves them online.
/// Saving is an online-only write (not one of the four outbox types), so it is
/// blocked with a needs-connection message when offline.
@Observable
@MainActor
final class SettingsModel {
    private(set) var loading = true
    private(set) var saving = false
    private(set) var loadError: AppError?
    var saveError: String?
    private(set) var saved = false
    private(set) var updatedAt = ""

    var form = SettingsValues()
    private var original = SettingsValues()

    @ObservationIgnored private var repo: SettingsRepository?
    @ObservationIgnored private var isOnline: (() -> Bool)?
    @ObservationIgnored private var offlineMessage = "needs connection"

    func bind(_ c: AppContainer) {
        guard repo == nil else { return }
        #if DEBUG
        runSettingsSelfChecks()
        #endif
        repo = SettingsRepository(api: c.api)
        isOnline = { c.connectivity.isOnline }
        offlineMessage = c.i18n.t("common.needsConnection",
                                  default: "No connection — try again when you are back online.")
    }

    var invalidFields: Set<String> { SettingsValidation.invalidFields(form) }

    var isDirty: Bool { form != original }

    func load() async {
        loading = true
        loadError = nil
        defer { loading = false }
        guard let repo else {
            loadError = AppError(statusCode: 0, message: "Settings repository not available")
            return
        }
        do {
            let settings = try await repo.get()
            form = SettingsValues(settings)
            original = SettingsValues(settings)
            updatedAt = settings.updatedAt
        } catch let error as AppError {
            loadError = error
        } catch {
            loadError = AppError(statusCode: 0, message: error.localizedDescription)
        }
    }

    func save() async {
        guard let repo else { return }
        saved = false
        saveError = nil
        guard SettingsValidation.isValid(form) else {
            saveError = nil   // field-level markers carry the message
            return
        }
        guard isOnline?() ?? false else {
            saveError = offlineMessage
            return
        }
        saving = true
        defer { saving = false }
        do {
            try await repo.update(form)
            original = form
            saved = true
        } catch let error as AppError {
            saveError = error.message
        } catch {
            saveError = error.localizedDescription
        }
    }
}
