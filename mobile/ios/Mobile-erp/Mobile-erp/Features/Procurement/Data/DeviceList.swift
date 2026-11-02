import Foundation

/// A device row from `GET /devices` (server `DeviceListView`). Shared by the
/// shipment-detail devices table (`shipmentId`) and the QC queue
/// (`inspected=false`). `landedCost` is redaction-nullable — absent for
/// under-privileged users, which hides the cost column.
struct ProcDevice: Decodable, Identifiable {
    let id: String
    let imei: String
    let modelId: String
    let statusCode: String
    let landedCost: String?

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        imei = try c.decode(String.self, forKey: .imei)
        modelId = try c.decode(String.self, forKey: .modelId)
        statusCode = try c.decode(String.self, forKey: .statusCode)
        landedCost = c.decimalString(.landedCost)
    }

    enum CodingKeys: String, CodingKey { case id, imei, modelId, statusCode, landedCost }
}

/// One page of a device query.
struct PaginatedDevices: Decodable {
    let items: [ProcDevice]
    let total: Int

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        items = (try? c.decodeIfPresent([ProcDevice].self, forKey: .items)) ?? []
        total = (try? c.decodeIfPresent(Int.self, forKey: .total)) ?? 0
    }

    enum CodingKeys: String, CodingKey { case items, total }
}

/// Read access to `GET /devices` (perm `device.read`). `inspected` is the
/// string `"false"` for the QC queue; `shipmentId` scopes the detail table.
@MainActor
struct DevicesRepository {
    let api: ProcApi

    func query(shipmentId: String? = nil, inspected: String? = nil) async throws -> PaginatedDevices {
        var q = ["page": "1", "pageSize": "50"]
        if let shipmentId { q["shipmentId"] = shipmentId }
        if let inspected { q["inspected"] = inspected }
        return try await api.api.get("/devices", query: q)
    }
}
