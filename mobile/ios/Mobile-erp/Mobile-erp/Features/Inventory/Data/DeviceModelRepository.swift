import Foundation

/// The only place that talks to `/device-models`. List + attributes need
/// `device.read`; create / update need `device.update`.
@MainActor
struct DeviceModelRepository {
    let api: APIClient

    init(_ container: AppContainer) {
        self.api = container.api
    }

    func list() async throws -> [DeviceModelView] {
        try await api.get("/device-models")
    }

    /// One model's spec schema, used to drive the edit-device spec fields.
    func attributes(_ id: String) async throws -> [AttributeDef] {
        try await api.get("/device-models/\(id)/attributes")
    }

    func create(brand: String, name: String, customsCode: String?,
                attributes: [AttributeDef]) async throws {
        try await api.postVoid("/device-models",
                               body: CreateBody(brand: brand, name: name,
                                                customsCode: customsCode, attributes: attributes))
    }

    func update(id: String, brand: String, name: String,
                isActive: Bool, customsCode: String?, attributes: [AttributeDef]) async throws {
        try await api.patchVoid("/device-models/\(id)",
                                body: UpdateBody(brand: brand, name: name, isActive: isActive,
                                                 customsCode: customsCode, attributes: attributes))
    }

    private struct CreateBody: Encodable {
        let brand: String
        let name: String
        /// nil omits the key (no code); the server leaves it unset.
        let customsCode: String?
        let attributes: [AttributeDef]
    }

    /// Edit body. `customsCode` is encoded even when nil (explicit JSON null) so
    /// an admin can clear a wrong code; the server reads null as "clear it".
    private struct UpdateBody: Encodable {
        let brand: String
        let name: String
        let isActive: Bool
        let customsCode: String?
        let attributes: [AttributeDef]

        enum CodingKeys: String, CodingKey { case brand, name, isActive, customsCode, attributes }

        func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encode(brand, forKey: .brand)
            try c.encode(name, forKey: .name)
            try c.encode(isActive, forKey: .isActive)
            if let customsCode { try c.encode(customsCode, forKey: .customsCode) }
            else { try c.encodeNil(forKey: .customsCode) }
            try c.encode(attributes, forKey: .attributes)
        }
    }
}
