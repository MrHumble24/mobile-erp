import Foundation

/// A received batch of devices from a supplier (server `ShipmentView`).
/// `overheadCost` is cost-redacted → absent (nil) for under-privileged users.
struct Shipment: Decodable, Identifiable {
    let id: String
    let supplierId: String
    let shipmentDate: String          // ISO-8601 from the server
    let expectedCount: Int
    let deviceCount: Int
    let overheadCost: String?
    let notes: String?

    var isComplete: Bool { deviceCount >= expectedCount }
    /// Date portion only, for list rows.
    var dateLabel: String { String(shipmentDate.prefix(10)) }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        supplierId = try c.decode(String.self, forKey: .supplierId)
        shipmentDate = try c.decode(String.self, forKey: .shipmentDate)
        expectedCount = (try? c.decode(Int.self, forKey: .expectedCount)) ?? 0
        deviceCount = (try? c.decodeIfPresent(Int.self, forKey: .deviceCount)) ?? 0
        overheadCost = c.decimalString(.overheadCost)
        notes = try? c.decodeIfPresent(String.self, forKey: .notes)
    }

    enum CodingKeys: String, CodingKey {
        case id, supplierId, shipmentDate, expectedCount, deviceCount, overheadCost, notes
    }
}

/// Create/update body. `supplierId` is sent only on create (omitted → nil on
/// update). Operator-entered money is a `Decimal` so it encodes as an exact
/// JSON number, never a Double.
struct ShipmentWriteDTO: Encodable {
    let supplierId: String?
    let shipmentDate: String
    let expectedCount: Int
    let overheadCost: Decimal?
    let notes: String?
}

/// One device staged for batch intake, as the server expects it per unit.
struct IntakeDeviceDTO: Encodable {
    let imei: String
    let modelId: String
    let specs: [String: String]
    let acquisitionCost: Decimal
    let targetPrice: Decimal?
}

private struct AddDevicesBody: Encodable { let devices: [IntakeDeviceDTO] }

/// The only place that talks to `/shipments`. Reads need `shipment.read`,
/// shipment writes need `shipment.manage`, device intake needs `device.create`.
@MainActor
struct ShipmentsRepository {
    let api: ProcApi

    func list() async throws -> [Shipment] {
        try await api.api.get("/shipments")
    }

    func create(_ body: ShipmentWriteDTO) async throws -> Shipment {
        try await api.api.post("/shipments", body: body)
    }

    func update(_ id: String, _ body: ShipmentWriteDTO) async throws -> Shipment {
        try await api.patch("/shipments/\(id)", body: body)
    }

    /// Batch-register devices on a shipment. The allocated landed cost per unit
    /// shows up afterwards in the detail table, so the response is not read here.
    func addDevices(_ id: String, _ devices: [IntakeDeviceDTO]) async throws {
        try await api.api.postVoid("/shipments/\(id)/devices", body: AddDevicesBody(devices: devices))
    }
}
