import Foundation

/// Attribute input kind. Unknown codes fall back to `.text`.
enum AttributeType: String, Codable {
    case text, number, select

    init(code: String?) { self = AttributeType(rawValue: code ?? "") ?? .text }
}

/// One spec field defined on a device model (mirrors the server `AttributeDef`).
/// Drives the dynamic device-spec inputs. One source of truth for the shape.
struct AttributeDef: Codable, Identifiable, Equatable {
    var key: String
    var label: String
    var type: AttributeType
    var options: [String]
    var required: Bool
    var sortOrder: Int

    var id: String { key.isEmpty ? label : key }

    init(key: String = "", label: String = "", type: AttributeType = .text,
         options: [String] = [], required: Bool = false, sortOrder: Int = 0) {
        self.key = key
        self.label = label
        self.type = type
        self.options = options
        self.required = required
        self.sortOrder = sortOrder
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        key = try c.decodeIfPresent(String.self, forKey: .key) ?? ""
        label = try c.decodeIfPresent(String.self, forKey: .label) ?? ""
        type = AttributeType(code: try c.decodeIfPresent(String.self, forKey: .type))
        options = try c.decodeIfPresent([String].self, forKey: .options) ?? []
        required = try c.decodeIfPresent(Bool.self, forKey: .required) ?? false
        sortOrder = try c.decodeIfPresent(Int.self, forKey: .sortOrder) ?? 0
    }
}

/// A device model with its dynamic attribute schema (`GET /device-models`).
struct DeviceModelView: Codable, Identifiable {
    let id: String
    let brand: String
    let name: String
    let isActive: Bool
    let attributes: [AttributeDef]
    /// How customs writes this model (ADR 0027); nil when unset.
    let customsCode: String?

    var label: String { "\(brand) \(name)" }

    init(id: String, brand: String, name: String,
         isActive: Bool, attributes: [AttributeDef], customsCode: String? = nil) {
        self.id = id
        self.brand = brand
        self.name = name
        self.isActive = isActive
        self.attributes = attributes
        self.customsCode = customsCode
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        brand = try c.decode(String.self, forKey: .brand)
        name = try c.decode(String.self, forKey: .name)
        isActive = try c.decodeIfPresent(Bool.self, forKey: .isActive) ?? true
        attributes = try c.decodeIfPresent([AttributeDef].self, forKey: .attributes) ?? []
        customsCode = try c.decodeIfPresent(String.self, forKey: .customsCode)
    }
}
