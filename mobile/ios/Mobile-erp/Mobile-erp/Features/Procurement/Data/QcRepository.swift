import Foundation

/// The only place that talks to `/qc/*` (and `/devices/by-imei` for grading).
/// Reads need `qc.read`; inspection create needs `qc.create`; lookup writes
/// need `settings.manage` (enforced server-side).
@MainActor
struct QcRepository {
    let api: APIClient

    func createInspection(_ body: InspectionWriteDTO) async throws {
        try await api.postVoid("/qc/inspections", body: body)
    }

    func listInspections(passed: Bool?, page: Int = 1, pageSize: Int = 50) async throws -> PaginatedInspections {
        var q = ["page": "\(page)", "pageSize": "\(pageSize)"]
        if let passed { q["passed"] = passed ? "true" : "false" }
        return try await api.get("/qc/inspections", query: q)
    }

    func stats(from: String?, to: String?) async throws -> QcStats {
        var q: [String: String] = [:]
        if let from { q["from"] = from }
        if let to { q["to"] = to }
        return try await api.get("/qc/stats", query: q)
    }

    func deviceByImei(_ imei: String) async throws -> QcDeviceDetail {
        try await api.get("/devices/by-imei/\(imei)")
    }

    /// `kind` is `grades` or `defect-types`.
    func listLookups(_ kind: String, includeInactive: Bool) async throws -> [Lookup] {
        let q = includeInactive ? ["includeInactive": "true"] : [:]
        return try await api.get("/qc/\(kind)", query: q)
    }

    func createLookup(_ kind: String, _ body: LookupWriteDTO) async throws {
        try await api.postVoid("/qc/\(kind)", body: body)
    }

    func updateLookup(_ kind: String, _ code: String, _ body: LookupWriteDTO) async throws {
        try await api.patchVoid("/qc/\(kind)/\(code)", body: body)
    }
}
