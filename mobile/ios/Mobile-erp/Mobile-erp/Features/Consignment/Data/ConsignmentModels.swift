import Foundation

/// A consignment (Nasiya device transfer). Decodes `/consignments` rows and the
/// overdue feed, which adds the partner's phone/telegram for follow-up.
struct Consignment: Identifiable, Decodable, Hashable {
    let id: String
    let partnerId: String
    let partnerShopName: String
    let deviceId: String
    let imei: String
    let agreedPrice: String
    let dueDate: String
    let statusCode: String        // OUT | SETTLED | RETURNED
    let consignedAt: String
    let resolvedAt: String?
    let notes: String?
    let saleId: String?
    let partnerPhone: String?         // overdue feed only
    let partnerTelegramHandle: String?

    var isOut: Bool { statusCode == "OUT" }
}

struct ConsignmentStats: Decodable {
    let total: Int
    let openCount: Int
    let overdueCount: Int
    let outstanding: String
}

struct ConsignmentPage: Decodable {
    let items: [Consignment]
    let total: Int
    let page: Int
    let pageSize: Int
}

/// The server-side status tabs plus the derived `overdue` (open, past due).
enum ConsignmentStatusFilter: String, CaseIterable, Identifiable {
    case all, out = "OUT", overdue, settled = "SETTLED", returned = "RETURNED"
    var id: String { rawValue }

    /// Concrete `statusCode` query value, or nil for `all`/`overdue`.
    var statusCode: String? {
        switch self {
        case .out: return "OUT"
        case .settled: return "SETTLED"
        case .returned: return "RETURNED"
        default: return nil
        }
    }
    var labelKey: String {
        switch self {
        case .all: return "common.all"
        case .out: return "consignments.statusOut"
        case .overdue: return "consignments.statusOverdue"
        case .settled: return "consignments.statusSettled"
        case .returned: return "consignments.statusReturned"
        }
    }
}

/// Date-range preset for the period filter — the mobile port of the web
/// `shared/lib/date-range` presets. `all` applies no date bound.
enum RangePreset: String, CaseIterable, Identifiable {
    case all, today, d7, d30, month, lastMonth, custom
    var id: String { rawValue }

    /// i18n key for the label, or nil for `all` (uses `common.all`).
    var labelKey: String? {
        switch self {
        case .all: return nil
        case .today: return "reports.preset_today"
        case .d7: return "reports.preset_7d"
        case .d30: return "reports.preset_30d"
        case .month: return "reports.preset_month"
        case .lastMonth: return "reports.preset_lastMonth"
        case .custom: return "reports.preset_custom"
        }
    }
}

/// Server query for `/consignments` + `/consignments/stats`. Mirrors the web
/// `ConsignmentFilters`; `from`/`to` are day bounds widened to UTC datetimes.
struct ConsignmentQuery {
    var partnerId: String?
    var status: ConsignmentStatusFilter = .all
    var search: String = ""
    var fromDate: String = ""   // yyyy-MM-dd
    var toDate: String = ""
    var page = 1
    var pageSize = 25

    func params() -> [String: String] {
        var q: [String: String] = ["page": String(page), "pageSize": String(pageSize)]
        if let partnerId { q["partnerId"] = partnerId }
        if let code = status.statusCode { q["statusCode"] = code }
        if status == .overdue { q["overdue"] = "true" }
        let term = search.trimmingCharacters(in: .whitespaces)
        if !term.isEmpty { q["search"] = term }
        if !fromDate.isEmpty { q["from"] = "\(fromDate)T00:00:00.000Z" }
        if !toDate.isEmpty { q["to"] = "\(toDate)T23:59:59.999Z" }
        return q
    }
}

// MARK: - Write DTOs

/// Online `POST /consignments` body (one device). `clientMutationId` makes a
/// retry idempotent, matching the web create.
struct CreateConsignmentDto: Encodable {
    let imei: String
    let partnerId: String
    let agreedPrice: Double
    let dueDate: String
    let notes: String?
    let clientMutationId: String
}

struct SettleConsignmentDto: Encodable {
    let salePrice: Double?
    let notes: String?
}

struct ReturnConsignmentDto: Encodable {
    let reason: String?
    let condition: String?   // IN_STOCK | DEFECTIVE
}
