import Foundation

/// A user-managed catalog category (`GET /product-categories`), referenced
/// optionally by a device model's `categoryId` (ADR 0029). Guarded by the model
/// permissions — no permission code of its own.
struct ProductCategory: Decodable, Identifiable {
    let id: String
    let name: String
    let sortOrder: Int
    let isActive: Bool

    init(id: String, name: String, sortOrder: Int = 0, isActive: Bool = true) {
        self.id = id; self.name = name; self.sortOrder = sortOrder; self.isActive = isActive
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        sortOrder = try c.decodeIfPresent(Int.self, forKey: .sortOrder) ?? 0
        isActive = try c.decodeIfPresent(Bool.self, forKey: .isActive) ?? true
    }

    enum CodingKeys: String, CodingKey { case id, name, sortOrder, isActive }
}

/// The only place that talks to `/product-categories`. List needs `device.read`;
/// create / update need `device.update` (no category permission code).
@MainActor
struct ProductCategoryRepository {
    let api: APIClient

    init(_ container: AppContainer) { self.api = container.api }

    func list() async throws -> [ProductCategory] {
        try await api.get("/product-categories")
    }

    func create(name: String, sortOrder: Int?) async throws {
        _ = try await api.postJSON("/product-categories", body: body(name: name, sortOrder: sortOrder, isActive: nil))
    }

    func update(id: String, name: String?, sortOrder: Int?, isActive: Bool?) async throws {
        try await api.patchJSONVoid("/product-categories/\(id)", body(name: name, sortOrder: sortOrder, isActive: isActive))
    }

    private func body(name: String?, sortOrder: Int?, isActive: Bool?) -> [String: Any] {
        var b: [String: Any] = [:]
        if let name { b["name"] = name }
        if let sortOrder { b["sortOrder"] = sortOrder }
        if let isActive { b["isActive"] = isActive }
        return b
    }
}

/// Presentation for a product kind (ADR 0029): the i18n label + hint keys.
enum ProductKind {
    static let all = ["IMEI", "SERIAL", "QUANTITY"]

    static func labelKey(_ code: String) -> String {
        switch code {
        case "SERIAL": return "catalog.kindSerial"
        case "QUANTITY": return "catalog.kindQuantity"
        default: return "catalog.kindImei"
        }
    }

    static func hintKey(_ code: String) -> String {
        switch code {
        case "SERIAL": return "catalog.kindSerialHint"
        case "QUANTITY": return "catalog.kindQuantityHint"
        default: return "catalog.kindImeiHint"
        }
    }
}
