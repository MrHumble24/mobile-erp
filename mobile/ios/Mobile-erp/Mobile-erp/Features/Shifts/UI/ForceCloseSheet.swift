import SwiftUI

/// Force-close another cashier's forgotten open shift (ADR 0036, `shift.manage`):
/// the counted cash and a required note. Online only.
struct ForceCloseSheet: View {
    let shiftId: String
    let onDone: (ShiftReportView) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var count = ""
    @State private var note = ""
    @State private var busy = false
    @State private var error: String?

    private var valid: Bool {
        !count.trimmingCharacters(in: .whitespaces).isEmpty
            && !note.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("shifts.forceClose")) { dismiss() }
                Text(i18n.t("shifts.forceCloseHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                AppFormField(label: i18n.t("shifts.closingCash")) {
                    AppTextField(placeholder: "0", text: $count, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($count)
                }
                AppFormField(label: i18n.t("shifts.note")) {
                    AppTextField(placeholder: i18n.t("shifts.note"), text: $note)
                }
                if let error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("shifts.forceClose")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillDestructive)
                .disabled(busy || !valid)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }

    private func submit() {
        guard valid, !busy else { return }
        guard container.connectivity.isOnline else { error = i18n.t("credit.errorOffline"); return }
        busy = true
        error = nil
        let value = NSDecimalNumber(decimal: Decimal(string: count.trimmingCharacters(in: .whitespaces)) ?? 0).doubleValue
        let noteValue = note.trimmingCharacters(in: .whitespaces)
        Task {
            do {
                let closed = try await ShiftRepository(container).forceClose(shiftId, closingCount: value, note: noteValue)
                busy = false
                onDone(closed)
                dismiss()
            } catch let e as AppError {
                busy = false
                error = e.message
            } catch {
                busy = false
                self.error = error.localizedDescription
            }
        }
    }
}
