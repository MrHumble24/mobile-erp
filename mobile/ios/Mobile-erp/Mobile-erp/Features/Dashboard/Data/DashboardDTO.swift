import Foundation

/// Dashboard DTOs. The slice owns its own shapes (it may not import the reports
/// slice); `DashProfit` / `DashPricingRow` deliberately mirror a few reports
/// fields — see the slice README's shared-contract note. Cost fields optional
/// (redacted for under-privileged users).

struct DashProfit: Decodable {
    let revenue: Double
    let grossProfit: Double
    let expenses: Double
    let netOperatingIncome: Double
    let unitsSold: Int
    let retail: Double

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func d(_ k: CodingKeys) -> Double { (try? c.decode(Double.self, forKey: k)) ?? 0 }
        revenue = d(.revenue); grossProfit = d(.grossProfit)
        expenses = d(.expenses); netOperatingIncome = d(.netOperatingIncome)
        unitsSold = (try? c.decode(Int.self, forKey: .unitsSold)) ?? 0
        retail = (try? c.decode([String: Double].self, forKey: .byChannel))?["retail"] ?? 0
    }
    private enum CodingKeys: String, CodingKey {
        case revenue, grossProfit, expenses, netOperatingIncome, unitsSold, byChannel
    }
}

struct DashPricingRow: Decodable, Identifiable {
    let modelId: String
    let storage: String?
    let avgAcquisitionCost: Double?
    let avgSellingPrice: Double?
    let unitsInStock: Int
    let unitsSold: Int
    var id: String { modelId + (storage ?? "") }
}

struct LowStockItem: Decodable, Identifiable {
    let id: String
    let modelId: String
    let storage: String?
    let currentCount: Int
    let threshold: Int
}

struct OverdueConsignment: Decodable, Identifiable {
    let id: String
    let imei: String?
    let serialNumber: String?
    let agreedPrice: String
    let dueDate: String
    let partnerShopName: String

    var dueDisplay: String { DashDate.display(dueDate) }
    /// The code to show: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
}

struct DashDeviceModelRef: Decodable {
    let id: String
    let brand: String?
    let name: String?
    var label: String { "\(brand ?? "") \(name ?? "")".trimmingCharacters(in: .whitespaces) }
}

enum DashDate {
    static func display(_ iso: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: iso)
            ?? plain.date(from: iso) else { return iso }
        return out.string(from: date)
    }
    private static let plain: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()
    private static let out: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "dd.MM.yyyy"; return f
    }()
}
