import Foundation

/// Customs price-list DTOs (ADR 0027). Fees stay decimal **strings** for
/// `MoneyText`; dates are ISO-8601 strings. Reads need `customs.read`, the
/// create needs `customs.manage`. Slice-local types are `Customs…`-prefixed.

/// One price-list version in the history list (`GET /customs/price-lists`).
struct CustomsVersion: Decodable, Identifiable {
    let id: String
    let effectiveAt: String
    let note: String?
    let itemCount: Int
}

/// One row of the current list, with the previous version's fee for the code.
struct CustomsCurrentItem: Decodable, Identifiable {
    let customsCode: String
    let description: String?
    let fee: String
    let previousFee: String?
    let usedByModel: Bool

    var id: String { customsCode }

    /// Where this row's fee moved relative to the previous version.
    enum Change { case up, down, same, new }
    var change: Change {
        guard let prev = previousFee, let p = Decimal(string: prev) else { return .new }
        let f = Decimal(string: fee) ?? .zero
        if f > p { return .up }
        if f < p { return .down }
        return .same
    }
}

/// The current (newest) list, or nil when none exists (`GET …/current`).
struct CustomsCurrentList: Decodable {
    let id: String
    let effectiveAt: String
    let note: String?
    let items: [CustomsCurrentItem]
}

/// A model whose customs fee cannot be stamped (`GET …/unmatched-models`).
struct CustomsUnmatchedModel: Decodable, Identifiable {
    let id: String
    let brand: String
    let name: String
    let customsCode: String?
    let reason: String   // MISSING_CODE | CODE_NOT_IN_CURRENT_LIST

    var label: String { "\(brand) \(name)".trimmingCharacters(in: .whitespaces) }
    var reasonKey: String {
        reason == "MISSING_CODE" ? "customs.reasonMissingCode" : "customs.reasonNotInList"
    }
}

/// One point of a code's fee over time (`GET …/fees/:code/history`), oldest first.
struct CustomsFeePoint: Decodable, Identifiable {
    let listId: String
    let effectiveAt: String
    let fee: String
    var id: String { listId }
}

/// One row the operator edits in the new-list sheet; `fee` is a Decimal so it
/// encodes as an exact JSON number.
struct CustomsItemInput: Encodable {
    let customsCode: String
    let description: String?
    let fee: Decimal
}

/// Create body for `POST /customs/price-lists`.
struct CreateCustomsListDTO: Encodable {
    let effectiveAt: String?
    let note: String?
    let items: [CustomsItemInput]
}
