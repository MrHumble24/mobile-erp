import SwiftUI

/// One ledger movement card: type and account/date left, note and who below;
/// the signed mono amount right, tinted by sign.
struct BalanceHistoryRow: View {
    let tx: BalanceTransaction
    @Environment(I18n.self) private var i18n

    private var accountLabel: String {
        BalanceFormat.account(tx.accountCode, label: tx.account?.label, i18n)
    }
    private var typeLabel: String {
        BalanceFormat.type(tx.typeCode, label: tx.type?.label, i18n)
    }

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(typeLabel).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    HStack(spacing: Tokens.Space.sm) {
                        Text(accountLabel).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        Text(KitDate.day(tx.occurredAt)).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    }
                    if let note = tx.note, !note.isEmpty {
                        Text(note).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    if let by = tx.createdBy?.displayName, !by.isEmpty {
                        Text(by).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                if let amount = tx.amount {
                    MoneyText(value: amount, size: 15)
                        .fontWeight(.semibold)
                        .foregroundStyle(BalanceFormat.amountTint(amount))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                } else {
                    Text(i18n.t("balance.amountHidden")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
        }
    }
}
