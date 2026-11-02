import Foundation

/// Online reads/writes for `/consignments/*`. Consignments are not part of the
/// `/sync/changes` cache, so every read here needs a connection; the list
/// screen shows a needs-connection state offline. The three lifecycle writes
/// go through `ConsignmentWriter`, which falls back to the outbox — this
/// repository is only the REST half it calls when connected.
@MainActor
struct ConsignmentRepository {
    let api: APIClient

    func list(_ query: ConsignmentQuery) async throws -> ConsignmentPage {
        try await api.get("/consignments", query: query.params())
    }

    func stats(_ query: ConsignmentQuery) async throws -> ConsignmentStats {
        try await api.get("/consignments/stats", query: query.params())
    }

    func overdue() async throws -> [Consignment] {
        try await api.get("/consignments/overdue")
    }

    func get(_ id: String) async throws -> Consignment {
        try await api.get("/consignments/\(id)")
    }

    func create(_ dto: CreateConsignmentDto) async throws {
        try await api.postVoid("/consignments", body: dto)
    }

    func settle(_ id: String, _ dto: SettleConsignmentDto) async throws {
        try await api.postVoid("/consignments/\(id)/settle", body: dto)
    }

    func returnToStock(_ id: String, _ dto: ReturnConsignmentDto) async throws {
        try await api.postVoid("/consignments/\(id)/return", body: dto)
    }
}
