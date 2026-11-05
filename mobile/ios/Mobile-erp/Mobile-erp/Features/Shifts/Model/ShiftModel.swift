import Foundation
import Observation

/// The current-shift state for the till (ADR 0036): whether shifts are on, the
/// open shift (live figures) and the selling gate. One shift per cashier. While
/// shifts are on, a sale needs an open shift; offline, selling is allowed when a
/// shift was open the last time we looked (cached), since the server trusts
/// offline replays.
@MainActor
@Observable
final class ShiftModel {
    private(set) var shiftsEnabled = false
    private(set) var current: ShiftReportView?
    private(set) var loaded = false
    /// The report to show after opening / closing (drives a result sheet).
    var lastReport: ShiftReportView?
    var busy = false
    var error: String?
    /// Sheet flags, shared so the till bar and the checkout block open the same sheets.
    var showOpen = false
    var showClose = false

    @ObservationIgnored private var container: AppContainer?
    private var repo: ShiftRepository { ShiftRepository(api: container!.api) }
    private static let lastOpenKey = "shift_last_open"

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
    }

    /// Load the setting + my open shift. Offline, keep whatever we last knew.
    func load() async {
        guard let container else { return }
        if let settings: StoreSettings = try? await container.api.get("/settings") {
            shiftsEnabled = settings.shiftsEnabled
        }
        guard container.connectivity.isOnline else { loaded = true; return }
        current = try? await repo.current()
        cacheOpen(current != nil)
        loaded = true
    }

    /// Whether a sale may proceed now (used to gate the till button).
    func canSellNow(online: Bool) -> Bool {
        guard shiftsEnabled else { return true }
        return online ? current != nil : lastKnownOpen
    }

    /// Whether the UI should block selling and show the open-a-shift prompt.
    func blocksSale(online: Bool) -> Bool { shiftsEnabled && !canSellNow(online: online) }

    func open(openingCount: Double) async -> Bool {
        await write { try await $0.open(openingCount: openingCount) }
    }

    func close(closingCount: Double, note: String?) async -> Bool {
        await write { try await $0.close(closingCount: closingCount, note: note) }
    }

    /// Re-read the open shift (after a 409 NO_OPEN_SHIFT, or when the bar refreshes).
    func refresh() async {
        guard let container, container.connectivity.isOnline else { return }
        current = try? await repo.current()
        cacheOpen(current != nil)
    }

    private func write(_ body: (ShiftRepository) async throws -> ShiftReportView) async -> Bool {
        guard let container else { return false }
        guard container.connectivity.isOnline else { error = container.i18n.t("credit.errorOffline"); return false }
        busy = true
        error = nil
        defer { busy = false }
        do {
            let report = try await body(repo)
            current = report.isOpen ? report : nil
            lastReport = report
            cacheOpen(current != nil)
            return true
        } catch let e as AppError {
            error = e.message
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    private var lastKnownOpen: Bool { UserDefaults.standard.bool(forKey: Self.lastOpenKey) }
    private func cacheOpen(_ open: Bool) { UserDefaults.standard.set(open, forKey: Self.lastOpenKey) }
}
