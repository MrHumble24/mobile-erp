import Foundation

/// The only place that talks to `/repairs` (ADR 0040). Repairs are **online
/// only** — there is no outbox path. Every route 403s `REPAIRS_DISABLED` when
/// the setting is off; the caller surfaces that as a clear message.
@MainActor
struct RepairsRepository {
    let api: APIClient

    init(_ container: AppContainer) { self.api = container.api }
    init(api: APIClient) { self.api = api }

    func list(status: String?, from: Date?, to: Date?, search: String,
              page: Int, pageSize: Int) async throws -> RepairPage {
        var query: [String: String] = ["page": String(page), "pageSize": String(pageSize)]
        if let status, !status.isEmpty { query["status"] = status }
        if let from { query["from"] = ISO8601DateFormatter().string(from: from) }
        if let to { query["to"] = ISO8601DateFormatter().string(from: to) }
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { query["search"] = trimmed }
        return try await api.get("/repairs", query: query)
    }

    func get(_ id: String) async throws -> RepairView { try await api.get("/repairs/\(id)") }

    func report(from: Date?, to: Date?) async throws -> RepairReport {
        var query: [String: String] = [:]
        if let from { query["from"] = ISO8601DateFormatter().string(from: from) }
        if let to { query["to"] = ISO8601DateFormatter().string(from: to) }
        return try await api.get("/repairs/report", query: query)
    }

    func create(_ payload: CreateRepairPayload) async throws -> RepairView {
        try await api.post("/repairs", body: payload)
    }

    func changeStatus(_ id: String, _ payload: ChangeStatusPayload) async throws -> RepairView {
        try await api.post("/repairs/\(id)/status", body: payload)
    }

    func addPart(_ id: String, _ payload: AddPartPayload) async throws -> RepairView {
        try await api.post("/repairs/\(id)/parts", body: payload)
    }

    func removePart(_ id: String, partId: String) async throws {
        try await api.delete("/repairs/\(id)/parts/\(partId)")
    }

    func payment(_ id: String, _ payload: RepairMoneyPayload) async throws -> RepairView {
        try await api.post("/repairs/\(id)/payments", body: payload)
    }

    func refund(_ id: String, _ payload: RepairMoneyPayload) async throws -> RepairView {
        try await api.post("/repairs/\(id)/refund", body: payload)
    }

    func outsidePayment(_ id: String, _ payload: RepairMoneyPayload) async throws -> RepairView {
        try await api.post("/repairs/\(id)/outside-payment", body: payload)
    }

    /// Own-master options: the shop's users (`GET /users`, needs `user.read`).
    func masters() async throws -> [RepairPerson] {
        struct Profile: Decodable { let firstName: String?; let lastName: String? }
        struct Row: Decodable { let id: String; let email: String; let profile: Profile? }
        struct Page: Decodable { let items: [Row] }
        let page: Page = try await api.get("/users", query: ["pageSize": "200"])
        return page.items.map { row in
            let name = [row.profile?.firstName, row.profile?.lastName]
                .compactMap { $0 }.joined(separator: " ").trimmingCharacters(in: .whitespaces)
            return RepairPerson(id: row.id, name: name.isEmpty ? row.email : name)
        }
    }

    /// Quantity products for the parts picker (`GET /device-models`, QUANTITY only).
    func partProducts() async throws -> [PurchaseModel] {
        let models: [PurchaseModel] = try await api.get("/device-models")
        return models.filter { $0.isQuantity }
    }
}
