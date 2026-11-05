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
    /// Null on a serial unit (ADR 0029) — use `unitCode` for display.
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    /// The model's kind: IMEI | SERIAL | QUANTITY (nil when the server omits it).
    let kindCode: String?
    let modelId: String
    let modelLabel: String
    let statusCode: String

    /// The code to show the user: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
    let specs: [String: String]
    let targetPrice: String?
    /// Resolved list prices per level (ADR 0034); empty when none are set.
    let prices: PriceLevelPrices
    let landedCost: String?
    /// Cost-restricted (absent for users without `device.cost.view`, ADR 0026/0027).
    let unitExpense: String?
    let unitExpenseNote: String?
    let customsFee: String?
    let intakeDate: String
    let version: Int
    let latestInspection: QcSummary?

    init?(json: [String: Any]) {
        guard let id = json["id"] as? String,
              let modelId = json["modelId"] as? String,
              let statusCode = json["statusCode"] as? String else { return nil }
        self.id = id
        self.imei = json["imei"] as? String
        self.imei2 = json["imei2"] as? String
        self.serialNumber = json["serialNumber"] as? String
        self.modelId = modelId
        self.statusCode = statusCode
        let model = json["model"] as? [String: Any] ?? [:]
        self.kindCode = model["kindCode"] as? String
        let brand = model["brand"] as? String ?? ""
        let name = model["name"] as? String ?? ""
        self.modelLabel = "\(brand) \(name)".trimmingCharacters(in: .whitespaces)
        self.specs = DeviceSpecs.stringify(json["specs"] as? [String: Any] ?? [:])
        self.targetPrice = DeviceSpecs.scalar(json["targetPrice"])
        self.prices = PriceLevelPrices.from(json: json["prices"] as? [String: Any])
        self.landedCost = DeviceSpecs.scalar(json["landedCost"])
        self.unitExpense = DeviceSpecs.scalar(json["unitExpense"])
        self.unitExpenseNote = json["unitExpenseNote"] as? String
        self.customsFee = DeviceSpecs.scalar(json["customsFee"])
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
