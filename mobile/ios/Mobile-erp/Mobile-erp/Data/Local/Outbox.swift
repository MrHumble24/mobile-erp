import Foundation
import SwiftData

/// The only four offline-writable mutation types (the server's push handlers).
/// A typed enum — features cannot enqueue anything else by mistake.
enum OutboxType: String {
    case saleCreate = "sale.create"
    case consignmentCreate = "consignment.create"
    case consignmentSettle = "consignment.settle"
    case consignmentReturn = "consignment.return"
}

/// Feature-facing outbox API. Features enqueue a Codable payload; the sync
/// push drain sends it and reconciles the result. Nothing else writes here.
@MainActor
struct Outbox {
    let context: ModelContext

    /// Queue an offline mutation. `id` doubles as the server idempotency key.
    @discardableResult
    func enqueue(_ type: OutboxType, payload: some Encodable, baseVersion: Int? = nil) throws -> String {
        let data = try JSONEncoder().encode(payload)
        let entry = OutboxEntry(
            id: newUUID(),
            type: type.rawValue,
            payloadJSON: String(decoding: data, as: UTF8.self),
            baseVersion: baseVersion,
            occurredAt: ISO8601DateFormatter().string(from: Date())
        )
        context.insert(entry)
        try context.save()
        return entry.id
    }

    /// Entries still eligible to send, oldest first.
    func pending() -> [OutboxEntry] {
        let descriptor = FetchDescriptor<OutboxEntry>(
            predicate: #Predicate { $0.status == "pending" },
            sortBy: [SortDescriptor(\.occurredAt)]
        )
        return (try? context.fetch(descriptor)) ?? []
    }
}
