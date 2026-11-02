import Foundation

/// Latest QC inspection summary attached to a device detail.
struct QcSummary {
    let passed: Bool
    let gradeCode: String?
    let batteryHealth: Int?

    init?(json: Any?) {
        guard let j = json as? [String: Any] else { return nil }
        passed = j["passed"] as? Bool ?? false
        gradeCode = j["gradeCode"] as? String
        batteryHealth = (j["batteryHealth"] as? NSNumber)?.intValue
    }
}

/// Full device detail from `GET /devices/by-imei/:imei`. `landedCost` is present
/// only for users with `device.cost.view` (redacted → nil otherwise). `specs`
/// is open-ended JSONB; scalar values are stringified for display / editing.
struct DeviceDetail {
    let id: String
    let imei: String
    let modelId: String
    let modelLabel: String
    let statusCode: String
    let specs: [String: String]
    let targetPrice: String?
    let landedCost: String?
    let intakeDate: String
    let version: Int
    let latestInspection: QcSummary?

    init?(json: [String: Any]) {
        guard let id = json["id"] as? String,
              let imei = json["imei"] as? String,
              let modelId = json["modelId"] as? String,
              let statusCode = json["statusCode"] as? String else { return nil }
        self.id = id
        self.imei = imei
        self.modelId = modelId
        self.statusCode = statusCode
        let model = json["model"] as? [String: Any] ?? [:]
        let brand = model["brand"] as? String ?? ""
        let name = model["name"] as? String ?? ""
        self.modelLabel = "\(brand) \(name)".trimmingCharacters(in: .whitespaces)
        self.specs = DeviceSpecs.stringify(json["specs"] as? [String: Any] ?? [:])
        self.targetPrice = DeviceSpecs.scalar(json["targetPrice"])
        self.landedCost = DeviceSpecs.scalar(json["landedCost"])
        self.intakeDate = DeviceSpecs.scalar(json["intakeDate"]) ?? ""
        self.version = (json["version"] as? NSNumber)?.intValue ?? 0
        self.latestInspection = QcSummary(json: json["latestInspection"])
    }
}

/// One status-history row from `GET /devices/:id/history`.
struct DeviceHistoryEntry: Decodable, Identifiable {
    let id: String
    let fromStatusCode: String?
    let toStatusCode: String
    let reason: String?
    let changedAt: String
}

/// Spec-value helpers: the JSONB blob mixes strings and numbers.
enum DeviceSpecs {
    /// A JSON scalar (string / number / bool) as a display string, else nil.
    static func scalar(_ value: Any?) -> String? {
        switch value {
        case let s as String: return s
        case let n as NSNumber: return n.stringValue
        default: return nil
        }
    }

    static func stringify(_ map: [String: Any]) -> [String: String] {
        map.reduce(into: [:]) { acc, pair in
            if let s = scalar(pair.value) { acc[pair.key] = s }
        }
    }
}
