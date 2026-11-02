import Foundation
import SwiftData

/// Drains the outbox through `POST /sync/push`. Mutations are sent in
/// `occurredAt` order (the server applies them in order) and each result is
/// reconciled:
///  - applied | duplicate → delete the entry (a later pull refreshes records),
///  - conflict            → mark `conflict` (surfaced in the conflict inbox),
///  - rejected / unknown  → mark `rejected`, keep it, flag the error.
///
/// Nothing is ever silently dropped.
@MainActor
struct PushService {
    let api: APIClient
    let context: ModelContext
    let terminalID: String

    func drain() async throws {
        let outbox = Outbox(context: context)
        let pending = outbox.pending()
        guard !pending.isEmpty else { return }

        let mutations: [[String: Any]] = pending.map { m in
            var row: [String: Any] = [
                "id": m.id,
                "type": m.type,
                "payload": (try? JSONSerialization.jsonObject(
                    with: Data(m.payloadJSON.utf8))) ?? [:],
                "occurredAt": m.occurredAt,
            ]
            if let base = m.baseVersion { row["baseVersion"] = base }
            return row
        }

        let response = try await api.postJSON(
            "/sync/push",
            body: ["terminalId": terminalID, "mutations": mutations]
        )
        for result in response["results"] as? [[String: Any]] ?? [] {
            apply(result, in: context)
        }
        try? context.save()
    }

    private func apply(_ r: [String: Any], in context: ModelContext) {
        guard let id = r["id"] as? String else { return }
        let entry = try? context.fetch(
            FetchDescriptor<OutboxEntry>(predicate: #Predicate { $0.id == id })
        ).first
        guard let entry else { return }
        let status = r["status"] as? String
        switch status {
        case "applied", "duplicate":
            AppLog.info("sync", "push \(status!) \(entry.type) \(id)")
            context.delete(entry)
        case "conflict":
            AppLog.warn("sync", "push conflict \(entry.type) \(id)")
            entry.status = "conflict"
            entry.lastError = (r["conflictId"] as? String)
        default:   // "rejected" or anything unexpected → keep + flag
            AppLog.error("sync", "push rejected \(entry.type) \(id): \((r["error"] as? String) ?? "rejected")")
            entry.status = "rejected"
            entry.lastError = (r["error"] as? String) ?? "rejected"
        }
    }
}
