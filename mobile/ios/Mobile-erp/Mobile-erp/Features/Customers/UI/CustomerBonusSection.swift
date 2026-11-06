import SwiftUI

/// Loyalty points section in customer details sheet (`GET /customers/:id/bonus`, ADR 0043).
/// Hidden completely when disabled, offline, or when loading fails.
struct CustomerBonusSection: View {
    let customerId: String

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var bonus: BonusView?
    @State private var showAdjust = false

    private var canAdjust: Bool {
        container.session.can("bonus.adjust") && container.connectivity.isOnline
    }

    var body: some View {
        Group {
            if let bonus, bonus.enabled {
                VStack(alignment: .leading, spacing: Tokens.Space.md) {
                    HStack(alignment: .center) {
                        Text(i18n.t("customers.bonusTitle"))
                            .font(.ui(.heading))
                            .foregroundStyle(Tokens.text)
                        Spacer()
                        if canAdjust {
                            Button {
                                showAdjust = true
                            } label: {
                                Text(i18n.t("customers.bonusCorrect"))
                            }
                            .buttonStyle(.pillSecondary)
                        }
                    }

                    FactRow(label: i18n.t("customers.bonusBalance"), last: bonus.history.isEmpty) {
                        BonusText(value: bonus.balance, size: 16)
                            .fontWeight(.semibold)
                    }

                    if !bonus.history.isEmpty {
                        Text(i18n.t("customers.bonusHistory"))
                            .font(.ui(.bodyStrong))
                            .foregroundStyle(Tokens.text)

                        VStack(spacing: 0) {
                            ForEach(Array(bonus.history.enumerated()), id: \.element.id) { i, row in
                                historyRow(row)
                                if i < bonus.history.count - 1 {
                                    Divider().overlay(Tokens.border)
                                }
                            }
                        }
                    }
                }
                .sheet(isPresented: $showAdjust) {
                    CustomerBonusAdjustSheet(customerId: customerId) { updated in
                        self.bonus = updated
                    }
                }
            }
        }
        .task { await load() }
    }

    private func historyRow(_ row: BonusHistoryRow) -> some View {
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: Tokens.Space.xs) {
                    Text(typeLabel(row.typeCode))
                        .font(.ui(.caption))
                        .fontWeight(.medium)
                        .foregroundStyle(Tokens.text)
                    Text(KitDate.day(row.occurredAt))
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                }
                if let note = row.note, !note.isEmpty {
                    Text(note)
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                }
                if let createdBy = row.createdBy {
                    Text("\(i18n.t("customers.bonusBy")): \(createdBy.name)")
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                }
            }
            Spacer(minLength: Tokens.Space.sm)
            Text(signedAmount(row.amount))
                .font(.mono(15, weight: .semibold))
                .foregroundStyle((Double(row.amount) ?? 0) > 0 ? Tokens.success : Tokens.danger)
        }
        .padding(.vertical, Tokens.Space.sm)
    }

    private func typeLabel(_ code: String) -> String {
        switch code {
        case "EARN": return i18n.t("customers.bonusTypeEarn")
        case "SPEND": return i18n.t("customers.bonusTypeSpend")
        case "RETURN": return i18n.t("customers.bonusTypeReturn")
        case "CORRECTION": return i18n.t("customers.bonusTypeCorrection")
        default: return code
        }
    }

    private func signedAmount(_ amount: String) -> String {
        let val = Double(amount) ?? 0
        let formatted = BonusText.format(amount)
        return val > 0 ? "+\(formatted)" : formatted
    }

    private func load() async {
        guard container.connectivity.isOnline, container.storeFlags.bonusEnabled else { return }
        let repo = CustomersRepository(api: container.api)
        if let res = try? await repo.bonus(customerId) {
            self.bonus = res
        }
    }
}

/// Sheet for manual points correction (`POST /customers/:id/bonus/adjustments`).
struct CustomerBonusAdjustSheet: View {
    let customerId: String
    let onAdjusted: (BonusView) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var amount = ""
    @State private var reason = ""
    @State private var error: String?
    @State private var submitting = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Tokens.Space.md) {
                    Text(i18n.t("customers.bonusAdjustHint"))
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)

                    AppFormField(label: i18n.t("customers.bonusAmount")) {
                        AppTextField(
                            placeholder: i18n.t("customers.bonusAmountPlaceholder"),
                            text: $amount,
                            keyboard: .numbersAndPunctuation,
                            font: .mono(16, weight: .medium)
                        )
                        Text(i18n.t("customers.bonusAdjustNegative"))
                            .font(.ui(.caption))
                            .foregroundStyle(Tokens.muted)
                    }

                    AppFormField(label: i18n.t("customers.bonusReason")) {
                        AppTextField(
                            placeholder: i18n.t("customers.bonusReasonPlaceholder"),
                            text: $reason,
                            font: .data(.regular)
                        )
                    }

                    if let error {
                        FormErrorLine(message: error)
                    }

                    Button {
                        submit()
                    } label: {
                        if submitting {
                            ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity)
                        } else {
                            Text(i18n.t("customers.bonusApply")).frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.pillPrimary)
                    .disabled(submitting)
                }
                .padding(Tokens.Space.gutter)
            }
            .navigationTitle(i18n.t("customers.bonusAdjustTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func submit() {
        if let errKey = CustomerBonusValidation.validate(amount: amount, reason: reason) {
            self.error = i18n.t(errKey)
            return
        }
        guard container.connectivity.isOnline else {
            self.error = i18n.t("common.offline")
            return
        }
        guard let num = Double(amount.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            self.error = i18n.t("customers.bonusErrAmountFormat")
            return
        }
        submitting = true
        error = nil
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        Task {
            do {
                let repo = CustomersRepository(api: container.api)
                let updated = try await repo.adjustBonus(customerId: customerId, amount: num, reason: trimmedReason)
                submitting = false
                container.toasts.success(i18n.t("customers.bonusAdjusted"))
                onAdjusted(updated)
                dismiss()
            } catch let appErr as AppError {
                submitting = false
                self.error = appErr.message
            } catch {
                submitting = false
                self.error = error.localizedDescription
            }
        }
    }
}
