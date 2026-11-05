import Foundation
import SwiftData
import Observation

/// One server sync conflict, flattened from the server-owned `ConflictView`
/// JSON for display. Only identity + the attempted mutation type are shown.
struct ConflictRow: Identifiable {
    let id: String
    /// IMEI or serial number of the unit in conflict (ADR 0029), "—" when absent.
    let unitCode: String
    let type: String

    init?(_ json: [String: Any]) {
        guard let id = json["id"] as? String else { return nil }
        self.id = id
        let code = UnitCode.display(imei: json["imei"] as? String,
                                    serialNumber: json["serialNumber"] as? String)
        unitCode = code.isEmpty ? "—" : code
        let attempted = json["attemptedChange"] as? [String: Any]
        type = attempted?["type"] as? String ?? (json["type"] as? String ?? "—")
    }
}

/// Surfaces the offline sync engine: a manual trigger, the live outbox queue,
/// and — for a `sync.resolve` user — the server conflict inbox. Holds no sync
/// protocol logic; it reads the outbox and calls the foundation
/// `SyncController` / `ConflictStore`.
@Observable
@MainActor
final class SyncModel {
    private(set) var queue: [OutboxEntry] = []
    private(set) var conflicts: [ConflictRow] = []
    private(set) var conflictsLoading = false
    var conflictError: String?
    var actionError: String?

    @ObservationIgnored private var container: AppContainer?
    @ObservationIgnored private var offlineMessage = "needs connection"

    func bind(_ c: AppContainer) {
        container = c
        offlineMessage = c.i18n.t("common.needsConnection",
                                  default: "No connection — try again when you are back online.")
    }

    var isOnline: Bool { container?.connectivity.isOnline ?? false }
    func can(_ code: String) -> Bool { container?.session.can(code) ?? false }

    func refreshQueue() {
        guard let ctx = container?.modelContext else { return }
        let descriptor = FetchDescriptor<OutboxEntry>(
            sortBy: [SortDescriptor(\.createdAt)]
        )
        queue = (try? ctx.fetch(descriptor)) ?? []
    }

    func syncNow() async {
        guard isOnline else { actionError = offlineMessage; return }
        actionError = nil
        container?.sync.syncNow()
        await loadConflicts()
        refreshQueue()
    }

    func loadConflicts() async {
        guard can("sync.resolve"), let store = container?.conflicts() else { return }
        conflictsLoading = true
        conflictError = nil
        defer { conflictsLoading = false }
        do {
            conflicts = try await store.list().compactMap(ConflictRow.init)
        } catch let error as AppError {
            conflictError = error.message
        } catch {
            conflictError = error.localizedDescription
        }
    }

    func resolve(id: String, resolution: String) async {
        guard isOnline else { actionError = offlineMessage; return }
        guard let store = container?.conflicts() else { return }
        actionError = nil
        do {
            try await store.resolve(id: id, resolution: resolution)
            container?.sync.syncNow()
            await loadConflicts()
            refreshQueue()
        } catch let error as AppError {
            actionError = error.message
        } catch {
            actionError = error.localizedDescription
        }
    }
}
