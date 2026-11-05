import Foundation

/// A received batch of devices from a supplier (server `ShipmentView`). A
/// shipment has no expense of its own (ADR 0026): `unitExpenseTotal` and
/// `customsFeeTotal` are the computed sums over its phones, cost-redacted →
/// absent (nil) for under-privileged users. `devicesWithoutCustomsFee` is a
/// plain count (never redacted) that drives the warning line.
struct Shipment: Decodable, Identifiable {
    let id: String
    let supplierId: String
    let shipmentDate: String          // ISO-8601 from the server
    let expectedCount: Int
    let deviceCount: Int
    let unitExpenseTotal: String?
    let customsFeeTotal: String?
    let devicesWithoutCustomsFee: Int
    let notes: String?
    /// Account the purchase + per-phone expenses left from, fixed at creation.
    /// Optional so older cached shipments still decode.
    let paymentAccountCode: String?

    var isComplete: Bool { deviceCount >= expectedCount }
    /// Date portion only, for list rows.
    var dateLabel: String { String(shipmentDate.prefix(10)) }

    init(id: String, supplierId: String, shipmentDate: String, expectedCount: Int, deviceCount: Int = 0, unitExpenseTotal: String? = nil, customsFeeTotal: String? = nil, devicesWithoutCustomsFee: Int = 0, notes: String? = nil, paymentAccountCode: String? = nil) {
        self.id = id
        self.supplierId = supplierId
        self.shipmentDate = shipmentDate
        self.expectedCount = expectedCount
        self.deviceCount = deviceCount
        self.unitExpenseTotal = unitExpenseTotal
        self.customsFeeTotal = customsFeeTotal
        self.devicesWithoutCustomsFee = devicesWithoutCustomsFee
        self.notes = notes
        self.paymentAccountCode = paymentAccountCode
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        supplierId = try c.decode(String.self, forKey: .supplierId)
        shipmentDate = try c.decode(String.self, forKey: .shipmentDate)
        expectedCount = (try? c.decode(Int.self, forKey: .expectedCount)) ?? 0
        deviceCount = (try? c.decodeIfPresent(Int.self, forKey: .deviceCount)) ?? 0
        unitExpenseTotal = c.decimalString(.unitExpenseTotal)
        customsFeeTotal = c.decimalString(.customsFeeTotal)
        devicesWithoutCustomsFee = (try? c.decodeIfPresent(Int.self, forKey: .devicesWithoutCustomsFee)) ?? 0
        notes = try? c.decodeIfPresent(String.self, forKey: .notes)
        paymentAccountCode = try? c.decodeIfPresent(String.self, forKey: .paymentAccountCode)
    }

    enum CodingKeys: String, CodingKey {
        case id, supplierId, shipmentDate, expectedCount, deviceCount
        case unitExpenseTotal, customsFeeTotal, devicesWithoutCustomsFee, notes, paymentAccountCode
    }
}

/// Create/update body. `supplierId` is sent only on create (omitted → nil on
/// update). A shipment carries no expense of its own (ADR 0026).
struct ShipmentWriteDTO: Encodable {
    let supplierId: String?
    let shipmentDate: String
    let expectedCount: Int
    let notes: String?
    /// Sent only on create (the server fixes it); omitted on update.
    let paymentAccountCode: String?
}

/// One device staged for batch intake, as the server expects it per unit. The
/// customs fee is stamped server-side (never sent). `unitExpense` needs the
/// `device.expense` permission when non-zero (ADR 0026).
struct IntakeDeviceDTO: Encodable {
    let imei: String
    let imei2: String?
    let modelId: String
    let specs: [String: String]
    let acquisitionCost: Decimal
    let targetPrice: Decimal?
    let unitExpense: Decimal?
    let unitExpenseNote: String?
}

/// One device as returned by batch intake (`POST /shipments/:id/devices` →
/// server `RegisteredDeviceView`), carrying the server-stamped customs fee, the
/// phone expense and the computed landed cost so the intake sheet can show the
/// per-unit summary. All three are cost-redacted → absent (nil) for
/// under-privileged users.
struct RegisteredDevice: Decodable, Identifiable {
    let id: String
    let imei: String
    let customsFee: String?
    let unitExpense: String?
    let landedCost: String?

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        imei = try c.decode(String.self, forKey: .imei)
        customsFee = c.decimalString(.customsFee)
        unitExpense = c.decimalString(.unitExpense)
        landedCost = c.decimalString(.landedCost)
    }

    enum CodingKeys: String, CodingKey { case id, imei, customsFee, unitExpense, landedCost }
}

private struct AddDevicesBody: Encodable { let devices: [IntakeDeviceDTO] }

/// The only place that talks to `/shipments`. Reads need `shipment.read`,
/// shipment writes need `shipment.manage`, device intake needs `device.create`.
@MainActor
struct ShipmentsRepository {
    let api: APIClient

    func list() async throws -> [Shipment] {
        try await api.get("/shipments")
    }

    func create(_ body: ShipmentWriteDTO) async throws -> Shipment {
        try await api.post("/shipments", body: body)
    }

    func update(_ id: String, _ body: ShipmentWriteDTO) async throws -> Shipment {
        try await api.patch("/shipments/\(id)", body: body)
    }

    /// Batch-register devices on a shipment, returning each unit with its
    /// allocated landed cost (for the post-intake summary).
    func addDevices(_ id: String, _ devices: [IntakeDeviceDTO]) async throws -> [RegisteredDevice] {
        try await api.post("/shipments/\(id)/devices", body: AddDevicesBody(devices: devices))
    }
}
