import Foundation
import SwiftData

/// The only place that talks to `/sales/*` reads and the return write, plus the
/// offline warranty fallback from the cache. No React/UI here.
@MainActor
struct SalesRepository {
    let api: APIClient
    let context: ModelContext

    func list(_ filters: SaleFilters, page: Int, pageSize: Int) async throws -> SalesPage {
        var query = filters.query
        query["page"] = String(page)
        query["pageSize"] = String(pageSize)
        return try await api.get("/sales", query: query)
    }

    func stats(_ filters: SaleFilters) async throws -> SaleStatsView {
        try await api.get("/sales/stats", query: filters.query)
    }

    /// Cashier options for the sold-by filter. Reads `/users` (needs `user.read`)
    /// and flattens the profile into a display name. Best-effort: the caller
    /// only mounts the filter when the session has the permission.
    func cashiers() async throws -> [SalesCashier] {
        struct Profile: Decodable { let firstName: String?; let lastName: String? }
        struct Row: Decodable { let id: String; let email: String; let profile: Profile? }
        struct Page: Decodable { let items: [Row] }
        let page: Page = try await api.get("/users", query: ["pageSize": "200"])
        return page.items.map { row in
            let name = [row.profile?.firstName, row.profile?.lastName]
                .compactMap { $0 }.joined(separator: " ").trimmingCharacters(in: .whitespaces)
            return SalesCashier(id: row.id, name: name.isEmpty ? row.email : name)
        }
    }

    func warrantyOnline(_ imei: String) async throws -> WarrantyLookup {
        try await api.get("/sales/warranty/\(imei)")
    }

    /// Offline warranty from the cached device + its latest sale. Nil when the
    /// device is not cached or has never been sold.
    func warrantyOffline(_ imei: String) -> WarrantyLookup? {
        let descriptor = FetchDescriptor<DeviceEntity>(
            predicate: #Predicate { $0.imei == imei || $0.imei2 == imei }
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
