import Foundation
import SwiftData

/// Data access for partners. The directory list comes from the offline mirror
/// (`PartnerEntity`, hydrated by `/sync/changes`) when offline and from the
/// online `/partners` endpoint — which carries the aggregate counts the mirror
/// lacks — when connected. Ledger, aging and the three writes are online-only
/// (`/partners/*`); callers gate them on connectivity. All verbs (including the
/// `update` PATCH) go through the shared `APIClient`.
@MainActor
struct PartnerRepository {
    let api: APIClient
    let context: ModelContext

    /// Full partner list from the server (counts, flags, contacts).
    func listOnline() async throws -> [Partner] {
        let dtos: [PartnerDTO] = try await api.get("/partners")
        return dtos.map { $0.toDomain() }
    }

    /// Offline mirror — balances only; counts/flags unknown (shown as nil).
    func listCached() -> [Partner] {
        let rows = (try? context.fetch(
            FetchDescriptor<PartnerEntity>(sortBy: [SortDescriptor(\.shopName)]))) ?? []
        return rows.map {
            Partner(
                id: $0.id, shopName: $0.shopName, contactPerson: nil, phone: $0.phone,
                telegramHandle: nil, creditLimit: $0.creditLimit, notes: nil,
                isActive: true, outstanding: $0.outstanding, openCount: nil,
                overdueCount: nil, fromCache: true)
        }
    }

    func get(_ id: String) async throws -> Partner {
        let dto: PartnerDTO = try await api.get("/partners/\(id)")
        return dto.toDomain()
    }

    func ledger(_ id: String) async throws -> [LedgerEntry] {
        try await api.get("/partners/\(id)/ledger")
    }

    func aging(_ id: String) async throws -> [AgingBucket] {
        try await api.get("/partners/\(id)/aging")
    }

    func create(_ dto: CreatePartnerDto) async throws -> Partner {
        let created: PartnerDTO = try await api.post("/partners", body: dto)
        return created.toDomain()
    }

    func update(_ id: String, _ dto: UpdatePartnerDto) async throws {
        try await api.patchVoid("/partners/\(id)", body: dto)
    }

    func recordPayment(_ partnerId: String, _ dto: RecordPaymentDto) async throws {
        try await api.postVoid("/partners/\(partnerId)/payments", body: dto)
    }
}
