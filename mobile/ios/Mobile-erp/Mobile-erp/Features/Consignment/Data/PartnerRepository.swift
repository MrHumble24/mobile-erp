import Foundation
import SwiftData

/// Data access for partners. The directory list comes from the offline mirror
/// (`PartnerEntity`, hydrated by `/sync/changes`) when offline and from the
/// online `/partners` endpoint — which carries the aggregate counts the mirror
/// lacks — when connected. Ledger, aging and the three writes are online-only
/// (`/partners/*`); callers gate them on connectivity.
///
/// `update` is a PATCH, which the foundation `APIClient` does not expose (it
/// ships GET/POST only). To avoid touching foundation code we issue that one
/// verb through a tiny local request that reuses `Keychain`/`AppError`; the
/// base URL is read per call so a dev-panel switch still applies. Noted in the
/// slice README as the single foundation gap.
@MainActor
struct PartnerRepository {
    let api: APIClient
    let context: ModelContext
    let baseURL: () -> URL

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
        try await patch("/partners/\(id)", body: dto)
    }

    func recordPayment(_ partnerId: String, _ dto: RecordPaymentDto) async throws {
        try await api.postVoid("/partners/\(partnerId)/payments", body: dto)
    }

    /// The one verb the foundation client lacks. Same envelope mapping as
    /// `APIClient`; a non-login 401 is left to the next GET/POST to clear.
    private func patch(_ path: String, body: some Encodable) async throws {
        var req = URLRequest(url: baseURL().appendingPathComponent(path))
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = Keychain().string(.token), !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = try JSONEncoder().encode(body)

        let data: Data, response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw AppError.network
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw AppError(statusCode: status, body: data)
        }
    }
}
