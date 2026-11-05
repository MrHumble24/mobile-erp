import Foundation

/// Domain partner. The full shape comes from the online `/partners` endpoint;
/// the offline mirror (`PartnerEntity` from the sync cache) fills only the
/// always-cached fields, leaving the aggregate counts nil so the UI can hide
/// what it cannot know offline. Money columns stay Decimal strings.
struct Partner: Identifiable, Hashable {
    let id: String
    let shopName: String
    let contactPerson: String?
    let phone: String?
    let telegramHandle: String?
    let creditLimit: String
    let notes: String?
    let isActive: Bool
    let outstanding: String
    let openCount: Int?
    let overdueCount: Int?
    /// True when this row came from the offline mirror (counts/flags unknown).
    let fromCache: Bool
}

/// `/partners` list/detail row.
struct PartnerDTO: Decodable {
    let id: String
    let shopName: String
    let contactPerson: String?
    let phone: String?
    let telegramHandle: String?
    let creditLimit: String
    let notes: String?
    let isActive: Bool
    let outstanding: String
    let openCount: Int
    let overdueCount: Int

    func toDomain() -> Partner {
        Partner(
            id: id, shopName: shopName, contactPerson: contactPerson, phone: phone,
            telegramHandle: telegramHandle, creditLimit: creditLimit, notes: notes,
            isActive: isActive, outstanding: outstanding, openCount: openCount,
            overdueCount: overdueCount, fromCache: false)
    }
}

/// One interleaved ledger row (`/partners/:id/ledger`): a consignment charge or
/// a payment, with the running balance after it.
struct LedgerEntry: Decodable, Identifiable {
    let at: String
    let kind: String   // "consignment" | "payment"
    let refId: String
    let change: String
    let runningBalance: String
    let statusCode: String?
    let notes: String?

    var id: String { "\(refId)-\(at)" }
    var isConsignment: Bool { kind == "consignment" }
}

/// One aging bucket (`/partners/:id/aging`): current / d1_30 / … / d90_plus.
struct AgingBucket: Decodable, Identifiable {
    let bucket: String
    let count: Int
    let amount: String

    var id: String { bucket }
    var isOverdue: Bool { bucket != "current" && count > 0 }
}

// MARK: - Write DTOs (clean: optional nils are omitted by the synthesized
// encoder, so the server's `forbidNonWhitelisted` never sees an unknown key).

struct CreatePartnerDto: Encodable {
    let shopName: String
    let contactPerson: String?
    let phone: String?
    let telegramHandle: String?
    let creditLimit: Double?
    let notes: String?
}

struct UpdatePartnerDto: Encodable {
    let shopName: String?
    let contactPerson: String?
    let phone: String?
    let telegramHandle: String?
    let creditLimit: Double?
    let notes: String?
    let isActive: Bool?
}

struct RecordPaymentDto: Encodable {
    let amount: Double
    let consignmentId: String?
    let paidAt: String?
    let notes: String?
    /// Account the cash landed in; defaults to CASH on the server when omitted.
    let accountCode: String?
}
