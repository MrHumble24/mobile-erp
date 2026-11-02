import Foundation

/// A supplier of device shipments (server `SupplierView`). Cost-free, so no
/// redaction concerns here.
struct Supplier: Decodable, Identifiable {
    let id: String
    let name: String
    let country: String?
    let contact: String?
    let notes: String?
    let isActive: Bool

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        country = try? c.decodeIfPresent(String.self, forKey: .country)
        contact = try? c.decodeIfPresent(String.self, forKey: .contact)
        notes = try? c.decodeIfPresent(String.self, forKey: .notes)
        isActive = (try? c.decodeIfPresent(Bool.self, forKey: .isActive)) ?? true
    }

    enum CodingKeys: String, CodingKey { case id, name, country, contact, notes, isActive }
}

/// Create/update body. Optionals are omitted when nil (synthesized Codable uses
/// `encodeIfPresent`), satisfying the server's `forbidNonWhitelisted`.
/// ponytail: an empty field is sent as omitted, not null, so mobile cannot
/// clear a previously-set optional — add explicit-null support if that is asked.
struct SupplierWriteDTO: Encodable {
    let name: String
    let country: String?
    let contact: String?
    let notes: String?
    let isActive: Bool?
}

/// The only place that talks to `/suppliers`. Reads need `shipment.read`,
/// writes need `shipment.manage` (enforced server-side).
@MainActor
struct SuppliersRepository {
    let api: APIClient

    func list() async throws -> [Supplier] {
        try await api.get("/suppliers")
    }

    func create(_ body: SupplierWriteDTO) async throws -> Supplier {
        try await api.post("/suppliers", body: body)
    }

    func update(_ id: String, _ body: SupplierWriteDTO) async throws -> Supplier {
        try await api.patch("/suppliers/\(id)", body: body)
    }
}
