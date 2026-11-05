import Foundation

/// A counted bucket in the stats breakdowns (by grade / top defects).
struct QcCount: Identifiable {
    let key: String
    let label: String
    let count: Int
    var id: String { key }
}

/// QC statistics for a date range (server `QcStatsView`). No cost fields.
struct QcStats: Decodable {
    let inspected: Int
    let passed: Int
    let failed: Int
    /// Fraction 0..1 (×100 for a percentage).
    let passRate: Double
    let awaitingInspection: Int
    let avgBatteryHealth: Int?
    let byGrade: [QcCount]
    let topDefects: [QcCount]

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        inspected = (try? c.decodeIfPresent(Int.self, forKey: .inspected)) ?? 0
        passed = (try? c.decodeIfPresent(Int.self, forKey: .passed)) ?? 0
        failed = (try? c.decodeIfPresent(Int.self, forKey: .failed)) ?? 0
        passRate = (try? c.decodeIfPresent(Double.self, forKey: .passRate)) ?? 0
        awaitingInspection = (try? c.decodeIfPresent(Int.self, forKey: .awaitingInspection)) ?? 0
        avgBatteryHealth = try? c.decodeIfPresent(Int.self, forKey: .avgBatteryHealth)
        let grades = (try? c.decodeIfPresent([GradeBucket].self, forKey: .byGrade)) ?? []
        byGrade = grades.map { QcCount(key: $0.gradeCode, label: $0.gradeCode, count: $0.count) }
        let defects = (try? c.decodeIfPresent([DefectBucket].self, forKey: .topDefects)) ?? []
        topDefects = defects.map { QcCount(key: $0.defectCode, label: $0.label ?? $0.defectCode, count: $0.count) }
    }

    private struct GradeBucket: Decodable { let gradeCode: String; let count: Int }
    private struct DefectBucket: Decodable { let defectCode: String; let label: String?; let count: Int }

    enum CodingKeys: String, CodingKey {
        case inspected, passed, failed, passRate, awaitingInspection
        case avgBatteryHealth, byGrade, topDefects
    }
}

/// A device looked up by IMEI for grading (`GET /devices/by-imei/:imei`).
/// Subset of `DeviceDetailView`.
struct QcDeviceDetail: Decodable {
    let id: String
    let imei: String?
    let serialNumber: String?
    let statusCode: String
    let modelLabel: String

    /// The code to show: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        imei = try c.decodeIfPresent(String.self, forKey: .imei)
        serialNumber = try c.decodeIfPresent(String.self, forKey: .serialNumber)
        statusCode = try c.decode(String.self, forKey: .statusCode)
        if let model = try? c.decodeIfPresent(ModelRef.self, forKey: .model) {
            modelLabel = "\(model.brand) \(model.name)"
        } else {
            modelLabel = (try? c.decode(String.self, forKey: .modelId)) ?? ""
        }
    }

    private struct ModelRef: Decodable { let brand: String; let name: String }

    enum CodingKeys: String, CodingKey { case id, imei, serialNumber, statusCode, model, modelId }
}
