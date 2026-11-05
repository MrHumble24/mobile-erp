import SwiftUI

/// Which correction the sheet performs (ADR 0030). The raw value also drives the
/// `-openStockAdjust writeOff|count` screenshot helper.
enum StockAdjustMode: String, Identifiable {
    case writeOff, count
    var id: String { rawValue }
}

/// Write off pieces (quantity + required reason) or correct the count (the
/// counted quantity; the difference against the current level is shown before
/// saving). `stock.adjust` only; online-only. Calls back with the new level.
struct StockAdjustSheet: View {
    let mode: StockAdjustMode
    let modelId: String
    let currentQuantity: Int
    let onDone: (StockLevel) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var quantity = ""
    @State private var note = ""
    @State private var busy = false
    @State private var error: String?

    /// counted − current, shown live for a count correction.
    private var difference: Int? {
        guard mode == .count, let counted = Int(quantity.trimmingCharacters(in: .whitespaces)) else { return nil }
        return StockMath.countDifference(counted: counted, current: currentQuantity)
    }

    private var valid: Bool {
        guard let n = Int(quantity.trimmingCharacters(in: .whitespaces)) else { return false }
        switch mode {
        case .writeOff: return n > 0 && !note.trimmingCharacters(in: .whitespaces).isEmpty
        case .count: return n >= 0
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(mode == .writeOff ? i18n.t("catalog.writeOff") : i18n.t("catalog.countCorrection")) {
                    AppFormField(label: mode == .writeOff ? i18n.t("catalog.quantity") : i18n.t("catalog.countedQuantity")) {
                        AppTextField(placeholder: "0", text: $quantity, keyboard: .numberPad,
                                     font: .mono(20, weight: .bold))
                            .sanitizeDigits($quantity)
                    }
                    if let diff = difference {
                        HStack {
                            Text(i18n.t("catalog.countCorrection")).foregroundStyle(Tokens.muted)
                            Spacer()
                            Text(diff > 0 ? "+\(diff)" : "\(diff)")
                                .font(.data(.regular))
                                .foregroundStyle(diff < 0 ? Tokens.danger : Tokens.success)
                        }
                        .font(.subheadline)
                    }
                }
                Section(i18n.t("catalog.adjustReason")) {
                    AppTextField(placeholder: i18n.t("catalog.adjustReason"), text: $note)
                }
                if let error {
                    Section {
                        Label(error, systemImage: "exclamationmark.triangle")
                            .font(.footnote).foregroundStyle(Tokens.danger)
                    }
                }
                Section {
                    Button { save() } label: {
                        if busy { ProgressView().frame(maxWidth: .infinity) }
                        else { Text(i18n.t("common.save")).frame(maxWidth: .infinity) }
                    }
                    .buttonStyle(.pillPrimary)
                    .disabled(!valid || busy)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Tokens.card)
            .navigationTitle(mode == .writeOff ? i18n.t("catalog.writeOff") : i18n.t("catalog.countCorrection"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
            }
        }
    }

    private func save() {
        guard valid, !busy else { return }
        guard container.connectivity.isOnline else { error = i18n.t("common.offline", default: "Offline"); return }
        guard let n = Int(quantity.trimmingCharacters(in: .whitespaces)) else {
            error = i18n.t("catalog.errorQuantityPositive"); return
        }
        busy = true
        error = nil
        let repo = StockRepository(api: container.api)
        let trimmedNote = note.trimmingCharacters(in: .whitespaces)
        Task {
            do {
                let level: StockLevel
                switch mode {
                case .writeOff:
                    level = try await repo.writeOff(modelId: modelId, quantity: n, note: trimmedNote)
                case .count:
                    level = try await repo.countCorrection(modelId: modelId, countedQuantity: n,
                                                           note: trimmedNote.isEmpty ? nil : trimmedNote)
                }
                busy = false
                container.toasts.success(i18n.t("catalog.stockSaved"))
                onDone(level)
                dismiss()
            } catch let e as AppError {
                busy = false
                error = e.statusCode == 400 ? i18n.t("catalog.errorQuantityPositive") : e.message
            } catch {
                busy = false
                self.error = i18n.t("common.error")
            }
        }
    }
}
