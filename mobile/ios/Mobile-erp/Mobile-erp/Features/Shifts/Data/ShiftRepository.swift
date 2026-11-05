import Foundation

/// All data access for cashier shifts (ADR 0036). Online only — there is no
/// outbox path. Mirrors the web `shiftRepository`.
@MainActor
struct ShiftRepository {
    let api: APIClient

    init(_ container: AppContainer) { self.api = container.api }
    init(api: APIClient) { self.api = api }

    /// My open shift with live figures, or nil. `GET /shifts/current` answers 200
    /// with an EMPTY body when no shift is open, so an empty object decodes as nil.
    func current() async throws -> ShiftReportView? {
        let json = try await api.getJSON("/shifts/current")
        guard !json.isEmpty else { return nil }
        let data = try JSONSerialization.data(withJSONObject: json)
        return try JSONDecoder().decode(ShiftReportView.self, from: data)
    }

    func list(_ filters: ShiftListFilters, page: Int, pageSize: Int) async throws -> ShiftListResult {
        var query: [String: String] = ["page": String(page), "pageSize": String(pageSize)]
        if let id = filters.cashierId, !id.isEmpty { query["cashierId"] = id }
        if let from = filters.from { query["from"] = ISO8601DateFormatter().string(from: from) }
        if let to = filters.to { query["to"] = ISO8601DateFormatter().string(from: to) }
        return try await api.get("/shifts", query: query)
    }

    func report(_ id: String) async throws -> ShiftReportView {
        try await api.get("/shifts/\(id)/report")
    }

    /// Cashier options for the `shift.manage` list filter (reads `/users`).
    func cashiers() async throws -> [ShiftCashier] {
        struct Profile: Decodable { let firstName: String?; let lastName: String? }
        struct Row: Decodable { let id: String; let email: String; let profile: Profile? }
        struct Page: Decodable { let items: [Row] }
        let page: Page = try await api.get("/users", query: ["pageSize": "200"])
        return page.items.map { row in
            let name = [row.profile?.firstName, row.profile?.lastName]
                .compactMap { $0 }.joined(separator: " ").trimmingCharacters(in: .whitespaces)
            return ShiftCashier(id: row.id, name: name.isEmpty ? row.email : name)
        }
    }

    func open(openingCount: Double) async throws -> ShiftReportView {
        try await api.post("/shifts/open", body: OpenShiftPayload(openingCount: openingCount))
    }

    func close(closingCount: Double, note: String?) async throws -> ShiftReportView {
        try await api.post("/shifts/close", body: CloseShiftPayload(closingCount: closingCount, note: note))
    }

    func forceClose(_ id: String, closingCount: Double, note: String) async throws -> ShiftReportView {
        try await api.post("/shifts/\(id)/force-close",
                           body: ForceCloseShiftPayload(closingCount: closingCount, note: note))
    }
}
