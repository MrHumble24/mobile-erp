import SwiftUI

/// Close a shift (ADR 0036): expected cash is shown live (opening + cash
/// movements), the cashier types the counted cash and sees the difference before
/// confirming; an optional note; then the shift report. The difference posts to
/// the balance. Online only.
struct CloseShiftSheet: View {
    @Bindable var model: ShiftModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var count = ""
    @State private var note = ""
    @State private var report: ShiftReportView?

    private var expected: Decimal { Decimal(string: model.current?.expectedCash ?? "0") ?? 0 }
    private var difference: Decimal { ShiftMath.difference(counted: count.isEmpty ? "0" : count, expected: model.current?.expectedCash ?? "0") }
    private var valid: Bool { !count.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("shifts.closeShift")) { dismiss() }
                AppCard {
                    VStack(spacing: 0) {
                        fact(i18n.t("shifts.expectedCash"), model.current?.expectedCash ?? "0", tint: Tokens.text)
                        fact(i18n.t("shifts.cardTotal"), model.current?.cardTotal ?? "0", tint: Tokens.muted, last: true)
                    }
                }
                AppFormField(label: i18n.t("shifts.closingCash")) {
                    AppTextField(placeholder: "0", text: $count, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($count)
                }
                differenceRow
                AppFormField(label: i18n.t("shifts.note")) {
                    AppTextField(placeholder: i18n.t("shifts.note"), text: $note)
                }
                if let error = model.error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if model.busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("shifts.closeShift")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(model.busy || !valid)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .appSheet(item: $report) { r in ShiftReportSheet(report: r) }
        .task { await model.refresh() }
    }

    private var differenceRow: some View {
        let kind = ShiftMath.kind(difference)
        let tint = kind == .none ? Tokens.success : (kind == .short ? Tokens.danger : Tokens.warning)
        let label = kind == .none ? i18n.t("shifts.noDifference")
            : (kind == .short ? i18n.t("shifts.shortage") : i18n.t("shifts.surplus"))
        return VStack(alignment: .leading, spacing: Tokens.Space.xs) {
            HStack(spacing: Tokens.Space.sm) {
                Text(i18n.t("shifts.difference")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                Text(label).font(.ui(.caption)).foregroundStyle(tint)
                MoneyText(value: NSDecimalNumber(decimal: difference).stringValue, size: 15)
                    .fontWeight(.semibold).foregroundStyle(tint)
            }
            Text(i18n.t("shifts.differenceHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
        }
    }

    private func fact(_ label: String, _ value: String, tint: Color, last: Bool = false) -> some View {
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

    private func submit() {
        guard valid else { return }
        let value = NSDecimalNumber(decimal: Decimal(string: count.trimmingCharacters(in: .whitespaces)) ?? 0).doubleValue
        let noteValue = note.trimmingCharacters(in: .whitespaces)
        Task {
            if await model.close(closingCount: value, note: noteValue.isEmpty ? nil : noteValue) {
                report = model.lastReport
            }
        }
    }
}
