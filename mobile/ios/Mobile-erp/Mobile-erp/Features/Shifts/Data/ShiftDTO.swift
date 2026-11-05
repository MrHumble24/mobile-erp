import Foundation

/// Cashier shift DTOs (ADR 0036). Every money figure is a 2-dp Decimal string
/// from the server; `GET /shifts/current` answers 200 with an EMPTY body when no
/// shift is open, decoded as nil by the repository.

struct ShiftCashier: Decodable { let id: String; let name: String }

struct ShiftAccountGroup: Decodable, Identifiable {
    let accountCode: String
    let `in`: String
    let out: String
    let net: String
    var id: String { accountCode }
}

struct ShiftTypeAccount: Decodable, Identifiable {
    let accountCode: String
    let count: Int
    let total: String
    var id: String { accountCode }
}

struct ShiftTypeGroup: Decodable, Identifiable {
    let typeCode: String
    let count: Int
    let total: String
    let byAccount: [ShiftTypeAccount]
    var id: String { typeCode }
}

/// A shift plus its full computed figures. For an open shift `closedAt`,
/// `countedCash` and `difference` are null and the figures are live.
struct ShiftReportView: Decodable, Identifiable {
    let id: String
    let cashier: ShiftCashier
    let openedAt: String
    let closedAt: String?
    let note: String?
    let openingCount: String
    let expectedCash: String
    let countedCash: String?
    /// counted − expected, 2-dp string; null while open.
    let difference: String?
    let cardTotal: String
    let byAccount: [ShiftAccountGroup]
    let byType: [ShiftTypeGroup]

    var isOpen: Bool { closedAt == nil }
}

/// A light row for the shifts list. `difference` is 0.00 when closed clean, null
/// while open.
struct ShiftListItem: Decodable, Identifiable {
    let id: String
    let cashier: ShiftCashier
    let openedAt: String
    let closedAt: String?
    let openingCount: String
    let closingCount: String?
    let difference: String?

    var isOpen: Bool { closedAt == nil }
}

struct ShiftListResult: Decodable {
    let items: [ShiftListItem]
    let total: Int
    let page: Int
    let pageSize: Int
}

struct ShiftListFilters {
    /// Honoured only with `shift.manage`; the server forces it to the caller otherwise.
    var cashierId: String?
    var from: Date?
    var to: Date?
}

// MARK: - Write payloads

nonisolated struct OpenShiftPayload: Encodable { let openingCount: Double }
nonisolated struct CloseShiftPayload: Encodable { let closingCount: Double; let note: String? }
nonisolated struct ForceCloseShiftPayload: Encodable { let closingCount: Double; let note: String }
