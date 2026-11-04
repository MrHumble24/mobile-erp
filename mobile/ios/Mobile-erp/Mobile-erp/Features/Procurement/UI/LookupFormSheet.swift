import SwiftUI

/// Create or edit a QC lookup (`kind` = `grades` | `defect-types`) as a Warm
/// Card sheet. The code is immutable once created; online-only write.
struct LookupFormSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let kind: String
    let existing: Lookup?

    @State private var code = ""
    @State private var label = ""
    @State private var sortOrder = ""
    @State private var isActive = true
    @State private var busy = false
    @State private var error: String?

    private var editing: Bool { existing != nil }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    Text(i18n.t(kind == "grades" ? "qc.grades" : "qc.defectTypes")).font(.ui(.title)).foregroundStyle(Tokens.text)
                    Spacer(minLength: Tokens.Space.sm)
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Tokens.text)
                            .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                            .background(Tokens.surface2, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(i18n.t("common.cancel"))
                }
                AppFormField(label: i18n.t("qc.lookupCode")) {
                    AppTextField(placeholder: i18n.t("qc.lookupCode"), text: $code,
                                 keyboard: .asciiCapable, autocapitalization: .characters, disableAutocorrection: true,
                                 font: .data(.regular))
                        .disabled(editing)
                        .opacity(editing ? 0.6 : 1)
                }
                AppFormField(label: i18n.t("qc.lookupLabel")) {
                    AppTextField(placeholder: i18n.t("qc.lookupLabel"), text: $label)
                }
                AppFormField(label: i18n.t("qc.sortOrder")) {
                    AppTextField(placeholder: i18n.t("qc.sortOrder"), text: $sortOrder, keyboard: .numberPad, font: .data(.regular))
                        .sanitizeDigits($sortOrder)
                }
                if editing {
                    Toggle(i18n.t("qc.active"), isOn: $isActive)
                        .font(.ui(.body)).foregroundStyle(Tokens.text)
                        .frame(minHeight: Tokens.Space.minTouch)
                }
                if let error {
                    Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
                Button {
                    Task { await submit() }
                } label: {
                    Text(busy ? i18n.t("common.loading") : i18n.t("common.save")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(busy)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .onAppear(perform: hydrate)
    }

    private func hydrate() {
        guard let l = existing else { return }
        code = l.code
        label = l.label
        sortOrder = "\(l.sortOrder)"
        isActive = l.isActive
    }

    private func submit() async {
        guard !label.trimmed.isEmpty else { error = i18n.t("common.required"); return }
        if !editing && !LookupCode.isValid(code) {
            error = code.trimmed.isEmpty ? i18n.t("common.required") : i18n.t("qc.codeFormat")
            return
        }
        if let message = offlineBlock(container, i18n) { error = message; return }
        busy = true
        defer { busy = false }
        error = nil
        let repo = QcRepository(api: container.api)
        do {
            if let existing {
                try await repo.updateLookup(kind, existing.code, LookupWriteDTO(
                    code: nil, label: label.trimmed, sortOrder: Int(sortOrder.trimmed), isActive: isActive))
            } else {
                try await repo.createLookup(kind, LookupWriteDTO(
                    code: code.trimmed, label: label.trimmed, sortOrder: Int(sortOrder.trimmed), isActive: nil))
            }
            container.toasts.success(i18n.t("common.success"))
            dismiss()
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("qc.codeDuplicate") : e.message
        } catch let other {
            error = other.localizedDescription
        }
    }
}
