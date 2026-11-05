import SwiftUI

/// Open a shift (ADR 0036): type the cash counted in the drawer at the start.
/// Online only.
struct OpenShiftSheet: View {
    @Bindable var model: ShiftModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var count = ""

    private var valid: Bool { !count.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("shifts.openShift")) { dismiss() }
                AppFormField(label: i18n.t("shifts.openingCash")) {
                    AppTextField(placeholder: "0", text: $count, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($count)
                }
                if let error = model.error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if model.busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("shifts.openShift")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(model.busy || !valid)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium])
    }

    private func submit() {
        guard valid else { return }
        let value = NSDecimalNumber(decimal: Decimal(string: count.trimmingCharacters(in: .whitespaces)) ?? 0).doubleValue
        Task {
            if await model.open(openingCount: value) { dismiss() }
        }
    }
}
