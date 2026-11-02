import Foundation
import SwiftData

/// The only place that talks to `/sales/*` reads and the return write, plus the
/// offline warranty fallback from the cache. No React/UI here.
@MainActor
struct SalesRepository {
    let api: APIClient
    let context: ModelContext

    func list(_ filters: SaleFilters) async throws -> SalesPage {
        try await api.get("/sales", query: filters.query)
    }

    func warrantyOnline(_ imei: String) async throws -> WarrantyLookup {
        try await api.get("/sales/warranty/\(imei)")
    }

    /// Offline warranty from the cached device + its latest sale. Nil when the
    /// device is not cached or has never been sold.
    func warrantyOffline(_ imei: String) -> WarrantyLookup? {
        let descriptor = FetchDescriptor<DeviceEntity>(
            predicate: #Predicate { $0.imei == imei }
        )
        guard let device = try? context.fetch(descriptor).first else { return nil }
        return WarrantyOffline.fromCache(device)
    }

    func receipt(_ id: String) async throws -> ReceiptView {
        try await api.get("/sales/\(id)/receipt")
    }

    func processReturn(
        id: String,
        refundAmount: Double,
        toStatusCode: String,
        reason: String?,
        expectedVersion: Int?
    ) async throws {
        struct ReturnPayload: Encodable {
            let refundAmount: Double
            let deviceToStatusCode: String
            let reason: String?
            let expectedVersion: Int?
        }
        try await api.postVoid("/sales/\(id)/return", body: ReturnPayload(
            refundAmount: refundAmount,
            deviceToStatusCode: toStatusCode,
            reason: reason,
            expectedVersion: expectedVersion
        ))
    }
}
