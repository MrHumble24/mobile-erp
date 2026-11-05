import Foundation

/// Repair tickets (Change 13, ADR 0040). Online only. Money is a 2-dp Decimal
/// **string**; cost figures (part costs, outside paid, profit, outside cost) are
/// nil without `device.cost.view` — never assume a value. Dates are ISO strings
/// (rendered via `KitDate`). No passcode / ID field exists anywhere, by design.

// MARK: - Write payloads

/// Inline customer when no `customerId` is given (upserted by phone server-side).
nonisolated struct RepairCustomerPost: Encodable {
    let name: String
    let phone: String?
}

/// `POST /repairs` body. Swift omits nil optionals so no stray key is sent.
nonisolated struct CreateRepairPayload: Encodable {
    let customerId: String?
    let customer: RepairCustomerPost?
    let deviceName: String
    let modelId: String?
    let imei: String?
    let serialNumber: String?
    let problem: String
    let agreedPrice: Double
    let warrantyDays: Int
    let notes: String?
    /// Own master (a user id). Mutually exclusive with the outside fields.
    let masterUserId: String?
    let outsideMasterName: String?
    let outsideMasterPhone: String?
    let outsideCost: Double?
}

/// `POST /repairs/:id/status` body.
nonisolated struct ChangeStatusPayload: Encodable {
    let toStatusCode: String
    let note: String?
}

/// `POST /repairs/:id/parts` body (a quantity product + pieces).
nonisolated struct AddPartPayload: Encodable {
    let modelId: String
    let quantity: Int
}

/// `POST /repairs/:id/payments | refund | outside-payment` body.
nonisolated struct RepairMoneyPayload: Encodable {
    let amount: Double
    let accountCode: String
}

// MARK: - Read views

struct RepairPerson: Decodable { let id: String; let name: String }
struct RepairParty: Decodable { let id: String; let name: String; let phone: String? }

/// Who repairs the phone: the shop's own master, or an outside one; nil = unset.
struct RepairMaster: Decodable {
    /// `OWN` | `OUTSIDE`.
    let kind: String
    let userId: String?
    let name: String
    let phone: String?
    var isOutside: Bool { kind == "OUTSIDE" }
}

struct RepairPartView: Decodable, Identifiable {
    let id: String
    let modelId: String
    let name: String
    let quantity: Int
    let partUnitCost: String?
    let partLineCost: String?
    let addedBy: RepairPerson
    let createdAt: String
}

struct RepairPaymentView: Decodable, Identifiable {
    let id: String
    let accountCode: String
    /// Signed: positive = payment in, negative = refund out.
    let amount: String
    let occurredAt: String
    let receivedBy: RepairPerson
    var isRefund: Bool { (Decimal(string: amount) ?? 0) < 0 }
}

struct RepairStatusHistoryView: Decodable, Identifiable {
    let fromStatusCode: String?
    let toStatusCode: String
    let note: String?
    let changedBy: RepairPerson
    let changedAt: String
    var id: String { toStatusCode + changedAt }
}

/// Full ticket (`GET /repairs/:id`). Cost figures nil without the cost permission.
struct RepairView: Decodable, Identifiable {
    let id: String
    let ticketNumber: Int
    let customer: RepairParty
    let deviceName: String
    let modelId: String?
    let model: String?
    let imei: String?
    let serialNumber: String?
    let problem: String
    let agreedPrice: String
    let warrantyDays: Int
    let notes: String?
    let master: RepairMaster?
    let outsideCost: String?
    let statusCode: String
    let statusLabel: String
    let isTerminal: Bool
    let receivedBy: RepairPerson
    let receivedAt: String
    let createdAt: String
    let updatedAt: String
    let parts: [RepairPartView]
    let payments: [RepairPaymentView]
    let statusHistory: [RepairStatusHistoryView]
    let paid: String
    let outstanding: String
    let partsCost: String?
    let outsidePaid: String?
    let profit: String?
    let givenBackAt: String?
    let warrantyUntil: String?
    let underWarranty: Bool

    var code: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
    var owes: Bool { (Decimal(string: outstanding) ?? 0) > 0 }
}

/// A light row for the list (`GET /repairs`).
struct RepairListItem: Decodable, Identifiable {
    let id: String
    let ticketNumber: Int
    let customer: RepairParty
    let deviceName: String
    let imei: String?
    let statusCode: String
    let statusLabel: String
    let isTerminal: Bool
    let agreedPrice: String
    let paid: String
    let outstanding: String
    let receivedAt: String
    let warrantyUntil: String?
    let underWarranty: Bool
    var owes: Bool { (Decimal(string: outstanding) ?? 0) > 0 }
}

struct RepairPage: Decodable {
    let items: [RepairListItem]
    let total: Int
    let page: Int
    let pageSize: Int
}

/// Derived repair figures over a range (`GET /repairs/report`). Cost fields nil
/// without the cost permission; `income` is always shown.
struct RepairReport: Decodable {
    let from: String?
    let to: String?
    let income: String
    let partsCost: String?
    let outsideCost: String?
    let profit: String?
}
