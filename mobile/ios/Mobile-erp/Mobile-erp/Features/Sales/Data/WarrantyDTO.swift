import Foundation
import SwiftData

/// `GET /sales/warranty/:imei`, or an offline reconstruction from the cached
/// `DeviceEntity` + its latest sale (FOUNDATION: warranty works offline).
struct WarrantyLookup: Decodable {
    /// Null on a serial unit (ADR 0029) — use `unitCode` for display.
    let imei: String?
    let serialNumber: String?
    let saleId: String
    let salePrice: MoneyValue
    let remainingDays: Int
    let alreadyReturned: Bool
    let purchasedAt: String?
    let warranty: WarrantyWindow?
    let latestInspection: Inspection?

    var active: Bool { warranty?.endsAt != nil && remainingDays > 0 }
    var grade: String? { latestInspection?.grade }
    /// The code to show: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }

    struct WarrantyWindow: Decodable {
        let days: Int
        let startsAt: String?
        let endsAt: String?
    }
    struct Inspection: Decodable {
        let grade: String?
        let notes: String?
    }
}

/// `GET /sales/:id/receipt` — carries no cost/profit, ever.
struct ReceiptView: Decodable {
    let saleId: String
    let soldAt: String?
    let cashier: String
    let items: [Item]
    let total: MoneyValue
    let warranty: Window?
    let customer: Customer?
    /// Pricing (ADR 0034) — present only when the server adds them to the receipt
    /// endpoint; shown when a discount was given or the level is not retail.
    let listPrice: MoneyValue?
    let discountAmount: MoneyValue?
    let priceLevelCode: String?
    /// Phones taken in part payment (ADR 0039); nil/[] for an ordinary sale. The
    /// value is customer-facing, printed on the receipt.
    let tradeIns: [TradeIn]?

    var showsPricing: Bool {
        (Decimal(string: discountAmount?.string ?? "0") ?? 0) > 0
            || (priceLevelCode != nil && priceLevelCode != PriceLevels.retail)
    }
    var hasTradeIns: Bool { !(tradeIns ?? []).isEmpty }
    /// Σ of the trade-in values (netted off what the customer tendered).
    var tradeInTotal: Decimal {
        (tradeIns ?? []).reduce(.zero) { $0 + (Decimal(string: $1.value.string) ?? .zero) }
    }

    struct TradeIn: Decodable, Identifiable {
        let deviceId: String
        let imei: String?
        let serialNumber: String?
        let value: MoneyValue
        var id: String { deviceId }
        var code: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
    }

    struct Item: Decodable {
        let imei: String?
        let imei2: String?
        let serialNumber: String?
        let model: String
        let storage: String?
        let color: String?
        /// Pieces sold on a quantity line (ADR 0030); nil for a unit line.
        let quantity: Int?
        let price: MoneyValue
        /// The code to show: the IMEI when present, else the serial number.
        var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
        /// "× N" for a quantity line; empty for a unit line.
        var quantityLabel: String { quantity.map { "× \($0)" } ?? "" }
    }
    struct Window: Decodable {
        let days: Int
        let endsAt: String?
    }
    struct Customer: Decodable {
        let name: String
        let phone: String?
    }
}

enum WarrantyOffline {
    /// Build a warranty lookup from the cached device + its latest sale. The
    /// feed's `latestSale` is `{ id, soldAt, salePrice, warrantyEndsAt }`.
    /// `alreadyReturned` is inferred from the device status (a returned device
    /// is no longer SOLD) — an offline approximation.
    static func fromCache(_ d: DeviceEntity, now: Date = Date()) -> WarrantyLookup? {
        guard let json = d.latestSaleJSON,
              let data = json.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }

        let endsAt = obj["warrantyEndsAt"] as? String
        return WarrantyLookup(
            imei: d.imei,
            serialNumber: d.serialNumber,
            saleId: obj["id"] as? String ?? "",
            salePrice: money(obj["salePrice"]),
            remainingDays: remainingDays(endsAt, now: now),
            alreadyReturned: d.statusCode != "SOLD",
            purchasedAt: obj["soldAt"] as? String,
            warranty: endsAt.map { .init(days: 0, startsAt: nil, endsAt: $0) },
            latestInspection: d.gradeCode == nil && d.inspectionNotes == nil
                ? nil
                : .init(grade: d.gradeCode, notes: d.inspectionNotes)
        )
    }

    /// Whole days of cover left, floored at 0, a partial day counting as 1
    /// (ceil) — same rule as the server's `remainingWarrantyDays`.
    static func remainingDays(_ endsAt: String?, now: Date = Date()) -> Int {
        guard let endsAt, let end = parseDate(endsAt) else { return 0 }
        let seconds = end.timeIntervalSince(now)
        if seconds <= 0 { return 0 }
        return Int(ceil(seconds / 86_400))
    }

    private static func money(_ value: Any?) -> MoneyValue {
        if let str = value as? String { return MoneyValue(str) }
        if let n = value as? NSNumber { return MoneyValue(n.stringValue) }
        return MoneyValue("0")
    }
}

/// Parse an ISO-8601 instant (the kit's `KitDate.parse`; the sales name stays).
func parseDate(_ value: String?) -> Date? { KitDate.parse(value) }

#if DEBUG
enum SalesSelfCheck {
    static let ran: Void = {
        // Remaining days: future > 0, past == 0, nil == 0.
        let future = ISO8601DateFormatter().string(from: Date().addingTimeInterval(5 * 86_400))
        assert(WarrantyOffline.remainingDays(future) >= 5)
        let past = ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86_400))
        assert(WarrantyOffline.remainingDays(past) == 0)
        assert(WarrantyOffline.remainingDays(nil) == 0)
    }()
}
#endif
