#if DEBUG
import Foundation

/// Assert-based self-check for the balance slice's non-trivial pure logic:
/// decoding a balance that arrives as a JSON number or a decimal string, the
/// sign tints, and the entry-kind sign/note rules. Run once from `BalanceView`'s
/// `.task` — the lazy stand-in for a test target, matching the Core/Kit checks.
enum BalanceSelfCheck {
    private static var ran = false

    @MainActor static func run() {
        guard !ran else { return }
        ran = true
        checkDecoding()
        checkTints()
        checkEntryKind()
    }

    private static func checkDecoding() {
        // Balances arrive as JSON numbers today...
        let numbers = Data(#"{"accounts":[{"accountCode":"CASH","label":"Cash","balance":-500000}],"total":-200000}"#.utf8)
        let a = try! JSONDecoder().decode(BalanceSummary.self, from: numbers)
        assert(a.accounts.first?.balance == "-500000")
        assert(a.total == "-200000")
        // ...and as decimal strings after the in-progress server change.
        let strings = Data(#"{"accounts":[{"accountCode":"CARD","label":"Card","balance":"300000"}],"total":"300000.50"}"#.utf8)
        let b = try! JSONDecoder().decode(BalanceSummary.self, from: strings)
        assert(b.accounts.first?.balance == "300000")
        assert(b.total == "300000.50")
    }

    private static func checkTints() {
        assert(BalanceFormat.balanceTint("-1") == Tokens.danger)
        assert(BalanceFormat.balanceTint("0") == Tokens.text)
        assert(BalanceFormat.balanceTint("500000") == Tokens.text)
        assert(BalanceFormat.amountTint("-500000") == Tokens.danger)
        assert(BalanceFormat.amountTint("500000") == Tokens.success)
        assert(BalanceFormat.amountTint("0") == Tokens.text)
    }

    private static func checkEntryKind() {
        assert(BalanceEntryKind.deposit.typeCode == "DEPOSIT")
        assert(BalanceEntryKind.withdraw.typeCode == "WITHDRAWAL")
        assert(BalanceEntryKind.opening.signed && BalanceEntryKind.correction.signed)
        assert(!BalanceEntryKind.deposit.signed && !BalanceEntryKind.withdraw.signed)
        assert(BalanceEntryKind.correction.requiresNote && !BalanceEntryKind.deposit.requiresNote)
    }
}
#endif
