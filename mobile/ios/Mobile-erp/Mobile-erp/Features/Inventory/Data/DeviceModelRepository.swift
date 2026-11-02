import Foundation

/// The only place that talks to `/device-models`. List + attributes need
/// `device.read`; create / update need `device.update`.
@MainActor
struct DeviceModelRepository {
    let api: APIClient
    let http: InventoryHTTP

    init(_ container: AppContainer) {
        self.api = container.api
        self.http = InventoryHTTP(container)
    }

    func list() async throws -> [DeviceModelView] {
        try await api.get("/device-models")
    }

    /// One model's spec schema, used to drive the edit-device spec fields.
    func attributes(_ id: String) async throws -> [AttributeDef] {
        try await api.get("/device-models/\(id)/attributes")
    }

    func create(brand: String, name: String, attributes: [AttributeDef]) async throws {
        try await api.postVoid("/device-models",
                               body: CreateBody(brand: brand, name: name, attributes: attributes))
    }

    func update(id: String, brand: String, name: String,
                isActive: Bool, attributes: [AttributeDef]) async throws {
        try await http.patch("/device-models/\(id)",
                             body: UpdateBody(brand: brand, name: name,
                                              isActive: isActive, attributes: attributes))
    }

    private struct CreateBody: Encodable {
        let brand: String
        let name: String
        let attributes: [AttributeDef]
    }

    private struct UpdateBody: Encodable {
        let brand: String
        let name: String
        let isActive: Bool
        let attributes: [AttributeDef]
    }
}
