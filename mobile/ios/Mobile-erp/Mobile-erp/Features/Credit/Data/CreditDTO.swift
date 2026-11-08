import Foundation

/// Customer credit DTOs (ADR 0035). Reads carry money as 2-dp Decimal strings;
/// writes send positive numbers. Dates are ISO (`YYYY-MM-DD` for instalments).
/// Nothing derivable (agreedTotal, paid, outstanding, overdue) is stored server
/// side — the server computes it on every read.

// MARK: - Write payloads

/// A per-line discount sent with a credit line (`{ mode, value }`); mirrors the
/// sale discount. `nonisolated` so it encodes off the main actor like the sale.
nonisolated struct CreditDiscountPost: Encodable {
    let mode: String
    let value: Double
}

/// One cart line — exactly what `POST /sales` takes for a single sale. Swift's
/// synthesized `Encodable` omits nil optionals, so no stray keys reach the
/// server's `forbidNonWhitelisted`.
nonisolated struct CreditLinePost: Encodable {
    let imei: String?
    let serialNumber: String?
    let modelId: String?
    let quantity: Int?
    let salePrice: Double
    let priceLevelCode: String?
    let discount: CreditDiscountPost?
    let warrantyDays: Int?
    let notes: String?
}

/// One planned part: an amount due by a date. No interest/fee fields exist.
nonisolated struct CreditInstalmentPost: Encodable {
    let dueDate: String
    let amount: Double
}

/// A down-payment / later-payment tender line (cash or card).
nonisolated struct CreditTenderPost: Encodable {
    let accountCode: String
    let amount: Double
}

/// `POST /credits` body.
nonisolated struct CreateCreditPayload: Encodable {
    let customerId: String
    let lines: [CreditLinePost]
    /// Down payment taken now (cash/card/split); omitted when empty.
    let payments: [CreditTenderPost]?
    let instalments: [CreditInstalmentPost]
    let note: String?
    /// Idempotency key from the till.
    let clientKey: String?
}

/// A later payment on a credit, or an overpayment refund.
nonisolated struct CreditPaymentPayload: Encodable {
    let amount: Double
    let accountCode: String
}

// MARK: - Read views

struct CreditPartyRef: Decodable {
    let id: String
    let name: String
    let phone: String?
}

struct CreditSaleView: Decodable, Identifiable {
    let saleId: String
    let imei: String?
    let serialNumber: String?
    let model: String
    let quantity: Int?
    let salePrice: String
    let returnedAt: String?
    var id: String { saleId }
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
}

struct CreditInstalmentView: Decodable, Identifiable {
    let id: String
    let dueDate: String
    let amount: String
    let paid: String
    let overdue: Bool
}

struct CreditPaymentView: Decodable, Identifiable {
    let id: String
    let accountCode: String
    let amount: String
    let occurredAt: String
    let receivedBy: CreditPartyRef
}

/// Full credit detail (`GET /credits/:id`). Every derived figure is a 2-dp string.
struct CreditView: Decodable, Identifiable {
    let id: String
    let customer: CreditPartyRef
    let createdBy: CreditPartyRef
    let note: String?
    let createdAt: String
    let sales: [CreditSaleView]
    let instalments: [CreditInstalmentView]
    let payments: [CreditPaymentView]
    /// ADR 0068: cash price + one disclosed margin = the fixed agreed price.
    let cashPrice: String?
    let markupAmount: String?
    let agreedTotal: String
    let paid: String
    let outstanding: String
    let overpaid: String
    let overdueAmount: String
    let settled: Bool

    var overpaidDecimal: Decimal { Decimal(string: overpaid) ?? 0 }
}

/// A light row for the credits list (`GET /credits`).
struct CreditListItem: Decodable, Identifiable {
    let id: String
    let customer: CreditPartyRef
    let createdAt: String
    let agreedTotal: String
    let paid: String
    let outstanding: String
    let overdueAmount: String
    let settled: Bool

    var isOverdue: Bool { (Decimal(string: overdueAmount) ?? 0) > 0 }
}

struct CreditReportCustomer: Decodable, Identifiable {
    let customerId: String
    let name: String
    let phone: String?
    let outstanding: String
    let overdueAmount: String
    var id: String { customerId }
}

/// `GET /credits/report` (`report.finance`).
struct CreditReport: Decodable {
    let totalOutstanding: String
    let totalOverdue: String
    let customers: [CreditReportCustomer]
}

struct CreditContractStore: Decodable {
    let name: String?
    let address: String?
    let phone: String?
}

struct CreditContractGood: Decodable, Identifiable {
    let description: String
    let imei: String?
    let serialNumber: String?
    let quantity: Int?
    let price: String
    var id: String { (imei ?? serialNumber ?? description) + price }
}

struct CreditContractInstalment: Decodable, Identifiable {
    let dueDate: String
    let amount: String
    var id: String { dueDate + amount }
}

/// Everything a client prints for the paper contract (`GET /credits/:id/contract`).
struct CreditContract: Decodable {
    let creditId: String
    let createdAt: String
    let store: CreditContractStore
    let customer: CreditContractCustomer
    let goods: [CreditContractGood]
    /// ADR 0068: the disclosed cash-price / margin breakdown.
    let cashPrice: String?
    let markupAmount: String?
    let agreedTotal: String
    let downPayment: String
    let instalments: [CreditContractInstalment]
    /// The plain statement: no interest, no late fee ever.
    let terms: String

    struct CreditContractCustomer: Decodable { let name: String; let phone: String? }
}

/// The credit-relevant slice of `GET /customers/:id` (a `CustomerListItem`): the
/// name/phone for the sheet and the derived credit position for the limit guard.
struct CreditCustomer: Decodable {
    let id: String
    let name: String
    let phone: String?
    let creditOutstanding: String
    let creditOverdue: String
    /// Own limit, else the settings default; null = no cap.
    let effectiveCreditLimit: String?

    var outstanding: Decimal { Decimal(string: creditOutstanding) ?? 0 }
    var effectiveLimit: Decimal? { effectiveCreditLimit.flatMap { Decimal(string: $0) } }
    var hasPhone: Bool { !(phone ?? "").trimmingCharacters(in: .whitespaces).isEmpty }
}

/// The list filter the server honours (`?status=open|overdue|settled`).
enum CreditStatusFilter: String, CaseIterable, Identifiable {
    case all, open, overdue, settled
    var id: String { rawValue }
    /// The query value, or nil for "all".
    var query: String? { self == .all ? nil : rawValue }
    var labelKey: String {
        switch self {
        case .all: "credit.allCredits"
        case .open: "credit.open"
        case .overdue: "credit.overdue"
        case .settled: "credit.settled"
        }
    }
}
