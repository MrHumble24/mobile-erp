import SwiftUI

/// The result after a credit is sold (ADR 0035): the agreed price, what was paid
/// now (the down payment) and what is left to pay, then done.
struct CreditResultView: View {
    let credit: CreditView
    let onDone: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.lg) {
            HStack(spacing: Tokens.Space.sm) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 22)).foregroundStyle(Tokens.success)
                Text(i18n.t("credit.created")).font(.ui(.heading)).foregroundStyle(Tokens.text)
            }
            AppCard {
                VStack(spacing: 0) {
                    row(i18n.t("credit.agreedTotal"), credit.agreedTotal, tint: Tokens.text)
                    row(i18n.t("credit.paid"), credit.paid, tint: Tokens.success)
                    row(i18n.t("credit.outstanding"), credit.outstanding, tint: Tokens.text, last: true)
                }
            }
            Button { onDone() } label: { Text(i18n.t("common.done", default: "Done")).frame(maxWidth: .infinity) }
                .buttonStyle(.pillPrimary)
        }
    }

    private func row(_ label: String, _ value: String, tint: Color, last: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: Tokens.Space.sm) {
                Text(label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                MoneyText(value: value, size: 15).foregroundStyle(tint)
            }
            .frame(minHeight: Tokens.Space.rowH)
            if !last { Divider().overlay(Tokens.border) }
        }
    }
}
