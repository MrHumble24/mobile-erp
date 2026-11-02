import Foundation
import SwiftData

/// All data access for POS checkout. Reads the scanned device from the local
/// SwiftData cache (offline IMEI lookup), writes a sale online via the API or
/// enqueues it to the outbox. The ONLY place POS touches the DB or the client.
@MainActor
struct PosRepository {
    let context: ModelContext
    let api: APIClient

    /// Resolve a device by IMEI from the offline cache. Returns nil when the
    /// cache has never seen it (a sync refresh brings new stock in).
    func lookup(_ imei: String) -> ScannedDevice? {
        let descriptor = FetchDescriptor<DeviceEntity>(
            predicate: #Predicate { $0.imei == imei }
        )
        guard let d = try? context.fetch(descriptor).first else { return nil }
        let label = "\(d.modelBrand) \(d.modelName)"
            .trimmingCharacters(in: .whitespaces)
        return ScannedDevice(
            id: d.id, imei: d.imei, version: d.version,
            statusCode: d.statusCode, modelLabel: label, targetPrice: d.targetPrice
        )
    }

    /// IMEIs with a pending offline `sale.create` in the outbox — POS treats
    /// these as already sold so a re-scan is rejected until the push reconciles.
    /// Read-only over the outbox; the shared device cache is never mutated.
    func pendingSoldImeis() -> Set<String> {
        let descriptor = FetchDescriptor<OutboxEntry>(
            predicate: #Predicate { $0.type == "sale.create" && $0.status == "pending" }
        )
        let entries = (try? context.fetch(descriptor)) ?? []
        return Set(entries.compactMap { Self.imei(of: $0.payloadJSON) })
    }

    /// Typeahead search for attaching an existing customer (`GET /customers/lookup`,
    /// top 10 by name/phone). Online-only; nil query returns recent customers.
    func lookupCustomers(_ query: String) async throws -> [PosCustomerHit] {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        return try await api.get("/customers/lookup", query: trimmed.isEmpty ? [:] : ["q": trimmed])
    }

    /// Online checkout → `POST /sales`. Returns the created sale id for the receipt.
    func postSale(_ payload: SaleCreatePayload) async throws -> String {
        struct Created: Decodable { let id: String }
        let created: Created = try await api.post("/sales", body: payload)
        return created.id
    }

    /// Offline checkout → enqueue to the outbox; the push drain sends it later.
    func enqueueSale(_ payload: SaleCreatePayload, baseVersion: Int) throws {
        try Outbox(context: context).enqueue(.saleCreate, payload: payload, baseVersion: baseVersion)
    }

    /// Default warranty days from `GET /settings` (any authenticated user), to
    /// prefill the checkout form. Best-effort — nil when offline or unavailable.
    func defaultWarrantyDays() async -> Int? {
        struct Settings: Decodable { let defaultWarrantyDays: Int? }
        let settings: Settings? = try? await api.get("/settings")
        return settings?.defaultWarrantyDays
    }

    private static func imei(of payloadJSON: String) -> String? {
        guard let data = payloadJSON.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let imei = obj["imei"] as? String, !imei.isEmpty
        else { return nil }
        return imei
    }
}
