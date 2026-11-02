import Foundation

/// A QC lookup row (grade or defect type). Mirrors server `LookupView`.
/// `kind` in the API path is `grades` or `defect-types`.
struct Lookup: Decodable, Identifiable {
    let code: String
    let label: String
    let sortOrder: Int
    let isActive: Bool

    var id: String { code }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        code = try c.decode(String.self, forKey: .code)
        label = try c.decode(String.self, forKey: .label)
        sortOrder = (try? c.decodeIfPresent(Int.self, forKey: .sortOrder)) ?? 0
        isActive = (try? c.decodeIfPresent(Bool.self, forKey: .isActive)) ?? true
    }

    enum CodingKeys: String, CodingKey { case code, label, sortOrder, isActive }
}

/// Create/update body. `code` is sent only on create; `isActive` only on
/// update. Nil optionals are omitted (`forbidNonWhitelisted`).
struct LookupWriteDTO: Encodable {
    let code: String?
    let label: String?
    let sortOrder: Int?
    let isActive: Bool?
}
