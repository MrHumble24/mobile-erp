import Foundation
import SwiftData

/// All data access for POS checkout. Reads the scanned device from the local
/// SwiftData cache (offline IMEI lookup), writes a sale online via the API or
/// enqueues it to the outbox. The ONLY place POS touches the DB or the client.
@MainActor
struct PosRepository {
    let context: ModelContext
    let api: APIClient

    /// Resolve a device by any unit code (IMEI, second IMEI or serial number)
    /// from the offline cache. Returns nil when the cache has never seen it (a
    /// sync refresh brings new stock in).
    func lookup(_ code: String) -> ScannedDevice? {
        let descriptor = FetchDescriptor<DeviceEntity>(
            predicate: #Predicate { $0.imei == code || $0.imei2 == code || $0.serialNumber == code }
        )
        guard let d = try? context.fetch(descriptor).first else { return nil }
        let label = "\(d.modelBrand) \(d.modelName)"
            .trimmingCharacters(in: .whitespaces)
        return ScannedDevice(
            id: d.id, imei: d.imei, imei2: d.imei2, serialNumber: d.serialNumber,
            version: d.version, statusCode: d.statusCode, modelLabel: label,
            targetPrice: d.targetPrice,
            prices: PriceLevelPrices.from(jsonString: d.pricesJSON)
        )
    }

    /// Resolve a quantity product by its barcode from the offline cache
    /// (`ProductEntity`, synced from `/sync/changes`). Nil when not cached.
    func lookupProduct(_ barcode: String) -> PosCartProduct? {
        let descriptor = FetchDescriptor<ProductEntity>(
            predicate: #Predicate { $0.barcode == barcode }
        )
        guard let p = try? context.fetch(descriptor).first else { return nil }
        let name = "\(p.brand) \(p.name)".trimmingCharacters(in: .whitespaces)
        return PosCartProduct(modelId: p.modelId, name: name, barcode: p.barcode,
                              salePrice: p.salePrice, quantityInStock: p.quantity,
                              prices: PriceLevelPrices.from(jsonString: p.pricesJSON))
    }

    /// Resolve a code online via `GET /scan/:code` (ADR 0030). Returns the
    /// quantity product when the code is a product barcode; nil for a unit or a
    /// 404 (units resolve from the local cache).
    func scanProduct(_ code: String) async throws -> PosCartProduct? {
        let result: ScanResultDTO = try await api.get("/scan/\(code)")
        guard result.kind == "product", let p = result.product else { return nil }
        let name = "\(p.brand) \(p.name)".trimmingCharacters(in: .whitespaces)
        return PosCartProduct(modelId: p.modelId, name: name, barcode: p.barcode,
                              salePrice: p.salePrice, quantityInStock: p.quantity,
                              prices: p.prices ?? PriceLevelPrices())
    }

    /// Unit codes (IMEI or serial) with a pending offline `sale.create` in the
    /// outbox — POS treats these as already sold so a re-scan is rejected until
    /// the push reconciles. Read-only over the outbox; the cache is never mutated.
    func pendingSoldCodes() -> Set<String> {
        let descriptor = FetchDescriptor<OutboxEntry>(
            predicate: #Predicate { $0.type == "sale.create" && $0.status == "pending" }
        )
        let entries = (try? context.fetch(descriptor)) ?? []
        return Set(entries.compactMap { Self.code(of: $0.payloadJSON) })
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
    /// `baseVersion` is nil for a quantity sale (no device lock, ADR 0030).
    func enqueueSale(_ payload: SaleCreatePayload, baseVersion: Int?) throws {
        try Outbox(context: context).enqueue(.saleCreate, payload: payload, baseVersion: baseVersion)
    }

    /// Default warranty days from `GET /settings` (any authenticated user), to
    /// prefill the checkout form. Best-effort — nil when offline or unavailable.
    func defaultWarrantyDays() async -> Int? {
        struct Settings: Decodable { let defaultWarrantyDays: Int? }
        let settings: Settings? = try? await api.get("/settings")
        return settings?.defaultWarrantyDays
    }

    /// The scanned code of a queued sale — imei or serialNumber, whichever rode
    /// in the outbox payload (ADR 0029).
    private static func code(of payloadJSON: String) -> String? {
        guard let data = payloadJSON.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }
        if let imei = obj["imei"] as? String, !imei.isEmpty { return imei }
        if let serial = obj["serialNumber"] as? String, !serial.isEmpty { return serial }
        return nil
    }
}
