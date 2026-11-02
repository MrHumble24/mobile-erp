import Foundation

/// One spec field defined on a device model (server `ProcAttributeDef`).
struct ProcAttributeDef: Decodable, Identifiable {
    let key: String
    let label: String
    /// `text` | `number` | `select`.
    let type: String
    let options: [String]
    let required: Bool

    var id: String { key }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        key = try c.decode(String.self, forKey: .key)
        label = try c.decode(String.self, forKey: .label)
        type = (try? c.decode(String.self, forKey: .type)) ?? "text"
        options = (try? c.decodeIfPresent([String].self, forKey: .options)) ?? []
        required = (try? c.decodeIfPresent(Bool.self, forKey: .required)) ?? false
    }

    enum CodingKeys: String, CodingKey { case key, label, type, options, required }
}

/// A catalog model (brand + name) with its spec schema (server `DeviceModelView`).
/// Read-only here; drives intake's model picker + dynamic spec fields and the
/// QC queue's model-name map.
struct DeviceModel: Decodable, Identifiable {
    let id: String
    let brand: String
    let name: String
    let attributes: [ProcAttributeDef]

    var label: String { "\(brand) \(name)" }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        brand = try c.decode(String.self, forKey: .brand)
        name = try c.decode(String.self, forKey: .name)
        attributes = (try? c.decodeIfPresent([ProcAttributeDef].self, forKey: .attributes)) ?? []
    }

    enum CodingKeys: String, CodingKey { case id, brand, name, attributes }
}

/// Read-only access to `/device-models` (perm `device.read`).
@MainActor
struct DeviceModelsRepository {
    let api: APIClient

    func list() async throws -> [DeviceModel] {
        try await api.get("/device-models")
    }
}
