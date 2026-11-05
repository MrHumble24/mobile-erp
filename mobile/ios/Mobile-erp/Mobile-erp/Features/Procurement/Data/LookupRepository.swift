import Foundation

/// Device-code lookup for intake (ADR 0031). `GET /lookup?code=` resolves a box
/// code or IMEI from the reference lists; a 404 (the lists do not know it) maps
/// to nil so the caller shows only a quiet hint. Learning a link is an admin
/// write. The lookup never blocks saving — the caller runs it off the save path.
@MainActor
struct LookupRepository {
    let api: APIClient

    /// A box code's base is 5 chars; shorter input is never looked up.
    static let minCodeLength = 5

    func find(code: String) async throws -> LookupResult? {
        do {
            return try await api.get("/lookup", query: ["code": code])
        } catch let e as AppError where e.statusCode == 404 {
            return nil
        }
    }

    func teachLink(refBrand: String, refModel: String, modelId: String) async throws {
        try await api.postVoid("/lookup/links",
                               body: TeachLinkBody(refBrand: refBrand, refModel: refModel, modelId: modelId))
    }
}
