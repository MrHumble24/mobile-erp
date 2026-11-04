import SwiftUI

/// One partner card: name + mono phone left, outstanding (mono) right, the
/// credit bar, and a quiet record-payment pill when the viewer may pay.
/// Inactive partners carry a sold-tint pill.
struct PartnerListRow: View {
    let partner: Partner
    var onOpen: () -> Void
    var onPay: (() -> Void)?
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(partner.shopName).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                        Text(partner.phone ?? "—").font(.data(.regular)).foregroundStyle(Tokens.muted)
                        if !partner.isActive {
                            StatusBadge(i18n.t("partners.inactive"), color: Tokens.sold).padding(.top, Tokens.Space.xs)
                        }
                    }
                    Spacer(minLength: Tokens.Space.sm)
                    VStack(alignment: .trailing, spacing: 2) {
                        MoneyText(value: partner.outstanding, size: 17).fontWeight(.semibold).foregroundStyle(Tokens.text)
                        Text(i18n.t("partners.outstanding")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
                CreditBar(limit: partner.creditLimit, used: partner.outstanding)
                if let onPay {
                    Button { Haptic.tick.play(); onPay() } label: {
                        Text(i18n.t("partners.recordPayment")).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.pillSecondary)
                }
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onOpen)
    }
}
