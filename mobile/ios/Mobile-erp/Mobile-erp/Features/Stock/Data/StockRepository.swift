import Foundation

/// The only place that talks to `/stock`. Reads need `device.read`; the adjust
/// write needs `stock.adjust`. Online-only (stock is never in the offline cache
/// beyond the sell feed). No UI here.
@MainActor
struct StockRepository {
    let api: APIClient

    func list(categoryId: String?, search: String) async throws -> [StockLevel] {
        var q: [String: String] = [:]
        if let categoryId { q["categoryId"] = categoryId }
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { q["search"] = trimmed }
        return try await api.get("/stock", query: q)
    }

    func movements(_ modelId: String, page: Int, pageSize: Int) async throws -> StockMovementsPage {
        try await api.get("/stock/\(modelId)/movements",
                          query: ["page": String(page), "pageSize": String(pageSize)])
    }

    /// Write off `quantity` pieces (note required) → the new stock level.
    func writeOff(modelId: String, quantity: Int, note: String) async throws -> StockLevel {
        try await api.post("/stock/adjust", body: AdjustBody(
            modelId: modelId, type: "WRITE_OFF", quantity: quantity,
            countedQuantity: nil, note: note))
    }

    /// Correct the count to `countedQuantity` (server writes the diff) → the new
    /// stock level.
    func countCorrection(modelId: String, countedQuantity: Int, note: String?) async throws -> StockLevel {
        try await api.post("/stock/adjust", body: AdjustBody(
            modelId: modelId, type: "COUNT_CORRECTION", quantity: nil,
            countedQuantity: countedQuantity, note: note))
    }

    /// `POST /stock/adjust` body. Swift omits nil optionals so no stray key trips
    /// the server's `forbidNonWhitelisted`.
    private struct AdjustBody: Encodable {
        let modelId: String
        let type: String
        let quantity: Int?
        let countedQuantity: Int?
        let note: String?
    }
}
