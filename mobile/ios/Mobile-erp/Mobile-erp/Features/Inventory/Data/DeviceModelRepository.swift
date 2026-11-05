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

    func create(brand: String, name: String, kindCode: String, categoryId: String?,
                barcode: String?, modelCode: String?, customsCode: String?,
                salePrice: Decimal?, attributes: [AttributeDef]) async throws {
        try await api.postVoid("/device-models",
                               body: CreateBody(brand: brand, name: name, kindCode: kindCode,
                                                categoryId: categoryId, barcode: barcode,
                                                modelCode: modelCode, customsCode: customsCode,
                                                salePrice: salePrice, attributes: attributes))
    }

    func update(id: String, brand: String, name: String, isActive: Bool, kindCode: String,
                categoryId: String?, barcode: String?, modelCode: String?,
                customsCode: String?, salePrice: Decimal?, attributes: [AttributeDef]) async throws {
        try await api.patchVoid("/device-models/\(id)",
                                body: UpdateBody(brand: brand, name: name, isActive: isActive,
                                                 kindCode: kindCode, categoryId: categoryId,
                                                 barcode: barcode, modelCode: modelCode,
                                                 customsCode: customsCode, salePrice: salePrice,
                                                 attributes: attributes))
    }

    private struct CreateBody: Encodable {
        let brand: String
        let name: String
        let kindCode: String
        /// nil omits the key; the server leaves the field unset.
        let categoryId: String?
        let barcode: String?
        let modelCode: String?
        let customsCode: String?
        /// Default till price per piece (QUANTITY); nil omits the key.
        let salePrice: Decimal?
        let attributes: [AttributeDef]
    }

    /// Edit body. The optional fields are encoded even when nil (explicit JSON
    /// null) so an admin can clear a wrong value; the server reads null as "clear
    /// it". `kindCode` is always sent — unchanged is a no-op, a change is rejected
    /// 409 once the model has units (ADR 0029).
    private struct UpdateBody: Encodable {
        let brand: String
        let name: String
        let isActive: Bool
        let kindCode: String
        let categoryId: String?
        let barcode: String?
        let modelCode: String?
        let customsCode: String?
        let salePrice: Decimal?
        let attributes: [AttributeDef]

        enum CodingKeys: String, CodingKey {
            case brand, name, isActive, kindCode, categoryId, barcode, modelCode, customsCode, salePrice, attributes
        }

        func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encode(brand, forKey: .brand)
            try c.encode(name, forKey: .name)
            try c.encode(isActive, forKey: .isActive)
            try c.encode(kindCode, forKey: .kindCode)
            try encodeOrNull(&c, categoryId, .categoryId)
            try encodeOrNull(&c, barcode, .barcode)
            try encodeOrNull(&c, modelCode, .modelCode)
            try encodeOrNull(&c, customsCode, .customsCode)
            if let salePrice { try c.encode(salePrice, forKey: .salePrice) } else { try c.encodeNil(forKey: .salePrice) }
            try c.encode(attributes, forKey: .attributes)
        }

        private func encodeOrNull(_ c: inout KeyedEncodingContainer<CodingKeys>,
                                  _ value: String?, _ key: CodingKeys) throws {
            if let value { try c.encode(value, forKey: key) } else { try c.encodeNil(forKey: key) }
        }
    }
}
