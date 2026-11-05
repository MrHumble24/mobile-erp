import Foundation
import Observation

/// One editable part of the payment plan (bound to the plan rows).
struct CreditInstalmentRow: Identifiable {
    let id = UUID()
    var dueDate: Date
    /// Money string, edited by hand or filled by "split evenly".
    var amount: String
}

/// The credit draft for the till sheet (ADR 0035): a down payment (cash / card /
/// split) and a payment plan the seller fills evenly or edits by hand. All plan
/// arithmetic is tiyin-exact via `CreditPlan`, so the till blocks before the
/// server does. There is no interest or fee anywhere.
@MainActor
@Observable
final class CreditDraft {
    let dueTotal: Decimal
    /// How the down payment is tendered (cash / card / split).
    let payment = PaymentSelection()
    var downPayment: String = ""
    var parts: Int = 1
    var firstDue: Date
    var frequency: CreditPlan.Frequency = .month
    private(set) var instalments: [CreditInstalmentRow]

    init(dueTotal: Decimal) {
        self.dueTotal = dueTotal
        let first = CreditPlan.addMonths(Date(), 1)
        self.firstDue = first
        self.instalments = [CreditInstalmentRow(
            dueDate: first, amount: NSDecimalNumber(decimal: dueTotal).stringValue)]
    }

    func setAccounts(_ accounts: [PaymentAccount]) { payment.setAccounts(accounts) }

    // MARK: - Derived

    var downPaymentDecimal: Decimal {
        Decimal(string: downPayment.trimmingCharacters(in: .whitespaces)) ?? .zero
    }

    /// Still unplanned, in tiyin — zero means the plan balances.
    var remainingCents: Int {
        CreditPlan.planRemaining(cartTotal: dueTotal, downPayment: downPaymentDecimal,
                                 instalments: instalments.map(\.amount))
    }

    var remaining: Decimal { CreditPlan.money(remainingCents) }

    /// A split down payment whose parts do not add up to the typed down payment.
    var downUnbalanced: Bool {
        payment.method == .split && payment.splitEntered() != downPaymentDecimal
    }

    var hasPastDue: Bool { instalments.contains { CreditPlan.isPastDue($0.dueDate) } }
    var hasZeroPart: Bool { instalments.contains { CreditPlan.cents($0.amount) <= 0 } }

    var planValid: Bool {
        !instalments.isEmpty && remainingCents == 0 && !downUnbalanced && !hasPastDue && !hasZeroPart
    }

    /// The down-payment tender lines — cash/card send one explicit line so the
    /// server posts the down payment (empty means no down payment).
    var tenderParts: [CreditTenderPost] {
        let down = downPaymentDecimal
        switch payment.method {
        case .cash:
            return down > 0 ? [CreditTenderPost(accountCode: PaymentAccounts.cash, amount: double(down))] : []
        case .card:
            return down > 0 ? [CreditTenderPost(accountCode: PaymentAccounts.card, amount: double(down))] : []
        case .split:
            return payment.breakdown(total: down).map {
                CreditTenderPost(accountCode: $0.code, amount: double($0.amount))
            }
        }
    }

    var instalmentsPost: [CreditInstalmentPost] {
        instalments.map {
            CreditInstalmentPost(dueDate: CreditPlan.dateInput($0.dueDate),
                                 amount: double(Decimal(string: $0.amount) ?? .zero))
        }
    }

    // MARK: - Plan edits

    /// Fill the plan evenly: the amount left after the down payment, over `parts`,
    /// each part one month / week on. The remainder rides the last part.
    func applyEven() {
        let left = CreditPlan.cents(dueTotal) - CreditPlan.cents(downPaymentDecimal)
        let plan = CreditPlan.buildEvenPlan(amountCents: max(0, left), parts: max(1, parts),
                                            firstDue: firstDue, every: frequency)
        guard !plan.isEmpty else { return }
        instalments = plan.map { CreditInstalmentRow(dueDate: $0.due, amount: CreditPlan.moneyString($0.amount)) }
    }

    func setAmount(_ id: UUID, _ value: String) { patch(id) { $0.amount = value } }
    func setDue(_ id: UUID, _ value: Date) { patch(id) { $0.dueDate = value } }
    func addInstalment() { instalments.append(CreditInstalmentRow(dueDate: firstDue, amount: "")) }
    func removeInstalment(_ id: UUID) { instalments.removeAll { $0.id == id } }

    private func patch(_ id: UUID, _ change: (inout CreditInstalmentRow) -> Void) {
        guard let i = instalments.firstIndex(where: { $0.id == id }) else { return }
        change(&instalments[i])
    }

    private func double(_ d: Decimal) -> Double { NSDecimalNumber(decimal: d).doubleValue }
}
