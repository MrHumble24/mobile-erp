import Foundation

/// All data access for price levels and the price-manage screens (ADR 0034).
/// Reads/writes `GET|PUT /pricing/{products,units}/:id` and the level list. The
/// writes carry `price: null` to clear, sent as explicit JSON null (so the
/// `[String: Any]` body variant, never a synthesized Encodable that drops nil).
@MainActor
struct PricingRepository {
    let api: APIClient

    init(_ container: AppContainer) { self.api = container.api }
    init(api: APIClient) { self.api = api }

    func levels() async throws -> [PriceLevelDTO] { try await api.get("/pricing/levels") }

    func productPrices(_ modelId: String) async throws -> ProductPricesView {
        try await api.get("/pricing/products/\(modelId)")
    }

    func unitPrices(_ deviceId: String) async throws -> UnitPricesView {
        try await api.get("/pricing/units/\(deviceId)")
    }

    /// Save every storage × level product price in one call. `entries` holds the
    /// full matrix; a nil price clears that cell. Storage "" is sent as null.
    func setProductPrices(_ modelId: String, _ entries: [(storage: String, levelCode: String, price: Decimal?)]) async throws {
        let rows: [[String: Any]] = entries.map { e in
            var row: [String: Any] = ["levelCode": e.levelCode]
            row["storage"] = e.storage.isEmpty ? NSNull() : e.storage
            row["price"] = e.price.map { NSDecimalNumber(decimal: $0).doubleValue } ?? NSNull()
            return row
        }
        try await api.putJSONVoid("/pricing/products/\(modelId)", ["prices": rows])
    }

    /// Save a unit's own prices per level; a nil price clears the cell.
    func setUnitPrices(_ deviceId: String, _ entries: [(levelCode: String, price: Decimal?)]) async throws {
        let rows: [[String: Any]] = entries.map { e in
            ["levelCode": e.levelCode,
             "price": e.price.map { NSDecimalNumber(decimal: $0).doubleValue } ?? NSNull()]
        }
        try await api.putJSONVoid("/pricing/units/\(deviceId)", ["prices": rows])
    }
}
