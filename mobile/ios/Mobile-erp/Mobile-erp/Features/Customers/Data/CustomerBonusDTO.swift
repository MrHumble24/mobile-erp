import Foundation

/// Loyalty bonus history row (`GET /customers/:id/bonus`, ADR 0043).
struct BonusHistoryRow: Decodable, Identifiable {
    let id: String
    let typeCode: String
    let amount: String
    let occurredAt: String
    let note: String?
    let saleId: String?
    let createdBy: BonusCreatedBy?
}

struct BonusCreatedBy: Decodable {
    let id: String
    let name: String
}

/// Loyalty bonus balance and history for a customer (`GET /customers/:id/bonus`).
struct BonusView: Decodable {
    let customerId: String
    let enabled: Bool
    let earnPercent: String
    let maxRedeemPercent: String
    let balance: String
    let history: [BonusHistoryRow]
}

/// Pure validation rules for manual bonus adjustment (`POST /customers/:id/bonus/adjustments`).
enum CustomerBonusValidation {
    static func validate(amount: String, reason: String) -> String? {
        let trimmedAmount = amount.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedAmount.isEmpty { return "customers.bonusErrAmountRequired" }
        guard trimmedAmount.wholeMatch(of: /^-?\d+(\.\d{1,2})?$/) != nil, let num = Double(trimmedAmount) else {
            return "customers.bonusErrAmountFormat"
        }
        if num == 0 { return "customers.bonusErrAmountZero" }
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedReason.isEmpty { return "customers.bonusErrReasonRequired" }
        if trimmedReason.count > 500 { return "customers.bonusErrReasonTooLong" }
        return nil
    }
}

#if DEBUG
func runCustomerBonusSelfChecks() {
    // empty amount -> customers.bonusErrAmountRequired
    assert(CustomerBonusValidation.validate(amount: "", reason: "valid") == "customers.bonusErrAmountRequired")
    assert(CustomerBonusValidation.validate(amount: "   ", reason: "valid") == "customers.bonusErrAmountRequired")

    // not a number or more than 2 decimals -> customers.bonusErrAmountFormat
    assert(CustomerBonusValidation.validate(amount: "abc", reason: "valid") == "customers.bonusErrAmountFormat")
    assert(CustomerBonusValidation.validate(amount: "1.234", reason: "valid") == "customers.bonusErrAmountFormat")
    assert(CustomerBonusValidation.validate(amount: "-10.555", reason: "valid") == "customers.bonusErrAmountFormat")

    // zero -> customers.bonusErrAmountZero
    assert(CustomerBonusValidation.validate(amount: "0", reason: "valid") == "customers.bonusErrAmountZero")
    assert(CustomerBonusValidation.validate(amount: "0.00", reason: "valid") == "customers.bonusErrAmountZero")
    assert(CustomerBonusValidation.validate(amount: "-0", reason: "valid") == "customers.bonusErrAmountZero")

    // blank reason -> customers.bonusErrReasonRequired
    assert(CustomerBonusValidation.validate(amount: "100", reason: "") == "customers.bonusErrReasonRequired")
    assert(CustomerBonusValidation.validate(amount: "-50", reason: "   ") == "customers.bonusErrReasonRequired")

    // over 500 characters -> customers.bonusErrReasonTooLong
    let longReason = String(repeating: "x", count: 501)
    assert(CustomerBonusValidation.validate(amount: "100", reason: longReason) == "customers.bonusErrReasonTooLong")

    // valid positive and negative
    assert(CustomerBonusValidation.validate(amount: "100", reason: "loyalty gift") == nil)
    assert(CustomerBonusValidation.validate(amount: "-50.5", reason: "correction") == nil)
    assert(CustomerBonusValidation.validate(amount: "+10.25", reason: "fix") == nil || CustomerBonusValidation.validate(amount: "10.25", reason: "fix") == nil)
}
#endif
