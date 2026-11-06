import SwiftUI

/// Process-return form. Returns are ONLINE-ONLY (not one of the four offline
/// mutation types), so submit is blocked with a needs-connection message when
/// offline.
struct ReturnSheet: View {
    let saleId: String
    /// The sale's tender lines — the refund returns to these same account(s).
    /// Informational only; empty hides the line.
    var payments: [SalePaymentLine] = []
    /// The most that may be refunded (what was paid). The server rejects more
    /// with a 400 (ADR 0028); the field caps at it so that rarely fires. Nil =
    /// unknown (warranty-flow entry), so only the server guards.
    var maxRefund: Decimal? = nil
    /// A quantity sale (ADR 0030) has no device, so the restock-condition picker
    /// is hidden; the pieces are restored to stock regardless.
    var isQuantity = false
    /// A credit sale (ADR 0035): the return lowers the debt and hands back no
    /// cash, so the note is shown and the refund is 0.
    var isCredit = false
    /// The sale had a trade-in (ADR 0039): the traded-in phone stays with the
    /// shop and the trade-in part is refunded in cash — show the note.
    var hasTradeIns = false
    let onDone: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var refund = ""
    @State private var reason = ""
    @State private var condition = "IN_STOCK"
    @State private var busy = false
    @State private var error: String?

    /// Accounts the refund returns to, as sent on the original sale.
    private var refundDestination: String {
        payments.map { PaymentAccounts.label($0.accountCode, i18n) }.joined(separator: ", ")
    }

    /// The typed refund exceeds what was paid — the server would reject it 400.
    private var overLimit: Bool {
        guard let maxRefund, let entered = Decimal(string: refund.trimmingCharacters(in: .whitespaces)) else { return false }
        return entered > maxRefund
    }

    private var refundValid: Bool {
        SalesInput.money(refund) >= 0 && !refund.trimmingCharacters(in: .whitespaces).isEmpty && !overLimit
    }

    var body: some View {
        NavigationStack {
            Form {
                if isCredit {
                    Section {
                        Label(i18n.t("credit.returnNote"), systemImage: "info.circle")
                            .font(.footnote)
                            .foregroundStyle(Tokens.muted)
                    }
                }
                if hasTradeIns {
                    Section {
                        Label(i18n.t("purchases.returnTradeInNote", default: "The traded-in phone stays with the shop. The refund can be up to the money paid plus the trade-in value; the trade-in part is paid back in cash."),
                              systemImage: "info.circle")
                            .font(.footnote)
                            .foregroundStyle(Tokens.muted)
                    }
                }
                if !payments.isEmpty {
                    Section {
                        Text("\(i18n.t("balance.paidWith")): \(refundDestination)")
                            .font(.footnote)
                            .foregroundStyle(Tokens.muted)
                    }
                }
                Section(i18n.t("sales.refundAmount", default: "Refund Amount")) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("$")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(Tokens.muted)
                        TextField("0", text: $refund)
                            .font(.mono(24, weight: .bold))
                            .keyboardType(.decimalPad)
                            .monospacedDigit()
                            .sanitizeDecimal($refund)
                    }
                    .padding(.vertical, 2)
                }

                if !isQuantity {
                    Section(i18n.t("sales.returnCondition", default: "Restock Condition")) {
                        Picker(i18n.t("sales.returnCondition", default: "Condition"), selection: $condition) {
                            Text(i18n.t("sales.returnToStock", default: "In Stock (Resellable)")).tag("IN_STOCK")
                            Text(i18n.t("sales.returnToDefective", default: "Defective (Needs Repair)")).tag("DEFECTIVE")
                        }
                        .pickerStyle(.segmented)
                        .padding(.vertical, 2)
                    }
                }

                Section(i18n.t("sales.returnReason", default: "Return Reason")) {
                    TextField(i18n.t("sales.returnReasonPlaceholder", default: "Reason for device return"),
                              text: $reason, axis: .vertical)
                        .lineLimit(2...4)
                }

                if overLimit || error != nil {
                    Section {
                        Label(overLimit ? i18n.t("sales.refundTooHigh") : (error ?? ""),
                              systemImage: "exclamationmark.triangle")
                            .font(.footnote)
                            .foregroundStyle(Tokens.danger)
                    }
                }

                Section {
                    Button(action: submit) {
                        if busy {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Label(i18n.t("sales.returnDevice", default: "Confirm Return & Refund"),
                                  systemImage: "arrow.uturn.backward")
                                .font(.headline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                                .frame(height: 24)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Tokens.danger)
                    .disabled(!refundValid || busy)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .task { if isCredit, refund.isEmpty { refund = "0" } }
            .navigationTitle(i18n.t("sales.returnDevice", default: "Return & Refund"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
            }
        }
    }

    private func submit() {
        guard refundValid, !busy else { return }
        guard container.connectivity.isOnline else {
            error = i18n.t("common.offline", default: "You are offline. This action requires an internet connection.")
            return
        }
        busy = true
        error = nil
        Haptic.tick.play()
        let repo = SalesRepository(api: container.api, context: container.modelContext)
        Task {
            do {
                try await repo.processReturn(
                    id: saleId,
                    refundAmount: SalesInput.money(refund),
                    toStatusCode: condition,
                    reason: SalesInput.orNil(reason),
                    expectedVersion: nil
                )
                busy = false
                onDone()
                dismiss()
            } catch let e as AppError {
                busy = false
                if e.code == "SALE_UNIT_BOUGHT_BACK" {
                    error = i18n.t("sales.returnBoughtBack")
                } else if e.code == "TRADE_IN_REFUND_FORBIDDEN" {
                    error = i18n.t("sales.returnTradeInForbidden")
                } else {
                    switch e.statusCode {
                    case 409: error = i18n.t("sales.returnConflict", default: "Device status conflict. Please reload.")
                    case 400: error = i18n.t("sales.refundTooHigh")
                    default: error = e.message
                    }
                }
            } catch {
                busy = false
                self.error = error.localizedDescription
            }
        }
    }
}
