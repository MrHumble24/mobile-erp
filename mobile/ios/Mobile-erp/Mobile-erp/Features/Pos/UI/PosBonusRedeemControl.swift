import SwiftUI

/// Bonus points redemption control displayed above the payment fields in POS (ADR 0043, ADR 0047).
struct PosBonusRedeemControl: View {
    let model: PosViewModel

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    private var plan: BonusRedeemPlan { model.bonusRedeemPlan }

    var body: some View {
        if let bonus = model.customerBonus, bonus.enabled, container.storeFlags.bonusEnabled {
            if !container.connectivity.isOnline {
                if (Decimal(string: bonus.balance) ?? 0) > 0 {
                    Text(i18n.t("pos.bonusOffline"))
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                }
            } else if plan.max > 0 {
                AppCard {
                    VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                        FactRow(label: i18n.t("pos.bonusBalance")) {
                            BonusText(value: bonus.balance, size: 14)
                                .fontWeight(.medium)
                        }
                        FactRow(label: i18n.t("pos.bonusMax")) {
                            BonusText(value: NSDecimalNumber(decimal: plan.max).stringValue, size: 14)
                                .fontWeight(.medium)
                        }
                        HStack(spacing: Tokens.Space.sm) {
                            AppTextField(
                                placeholder: i18n.t("pos.bonusAmount"),
                                text: bonusBinding,
                                keyboard: .decimalPad,
                                font: .mono(15, weight: .medium)
                            )
                            .sanitizeDecimal(bonusBinding)
                            Button(i18n.t("pos.bonusUseMax")) {
                                model.bonusRequested = plan.max
                            }
                            .buttonStyle(.pillSecondary)
                        }
                    }
                }
            }
        }
    }

    private var bonusBinding: Binding<String> {
        Binding(
            get: {
                model.bonusRequested > 0 ? NSDecimalNumber(decimal: model.bonusRequested).stringValue : ""
            },
            set: { raw in
                let trimmed = raw.trimmingCharacters(in: .whitespaces)
                guard !trimmed.isEmpty, let d = Decimal(string: trimmed) else {
                    model.bonusRequested = 0
                    return
                }
                let cap = plan.max
                if d > cap {
                    model.bonusRequested = cap
                } else if d < 0 {
                    model.bonusRequested = 0
                } else {
                    model.bonusRequested = d
                }
            }
        )
    }
}
