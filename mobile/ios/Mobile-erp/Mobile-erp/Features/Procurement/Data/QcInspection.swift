import Foundation

/// One inspection row with device + inspector context (server
/// `QcInspectionListItem`). `repairCostEstimate` is redaction-nullable.
struct QcInspection: Decodable, Identifiable {
    let id: String
    let passed: Bool
    let imei: String
    let modelLabel: String
    let inspectorName: String
    let gradeCode: String?

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        passed = (try? c.decodeIfPresent(Bool.self, forKey: .passed)) ?? false
        gradeCode = try? c.decodeIfPresent(String.self, forKey: .gradeCode)
        let device = try? c.decodeIfPresent(DeviceRef.self, forKey: .device)
        imei = device?.imei ?? ""
        if let m = device?.model { modelLabel = "\(m.brand) \(m.name)" } else { modelLabel = "" }
        inspectorName = (try? c.decodeIfPresent(InspectorRef.self, forKey: .inspectedBy))?.name ?? ""
    }

    private struct DeviceRef: Decodable { let imei: String; let model: ModelRef? }
    private struct ModelRef: Decodable { let brand: String; let name: String }
    private struct InspectorRef: Decodable { let name: String? }

    enum CodingKeys: String, CodingKey { case id, passed, gradeCode, device, inspectedBy }
}

/// One page of inspections.
struct PaginatedInspections: Decodable {
    let items: [QcInspection]
    let total: Int

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        items = (try? c.decodeIfPresent([QcInspection].self, forKey: .items)) ?? []
        total = (try? c.decodeIfPresent(Int.self, forKey: .total)) ?? 0
    }

    enum CodingKeys: String, CodingKey { case items, total }
}

/// Create-inspection body. `inspectedById` is derived server-side from the JWT.
/// `repairCostEstimate` is sent only when the user may view costs and it is > 0.
struct InspectionWriteDTO: Encodable {
    let deviceId: String
    let passed: Bool
    let gradeCode: String?
    let batteryHealth: Int?
    let repairCostEstimate: Decimal?
    let notes: String?
    let defects: [DefectWriteDTO]
}

struct DefectWriteDTO: Encodable {
    let defectCode: String
    let notes: String?
}
