import SwiftUI

/// Create or edit a QC lookup (`kind` = `grades` | `defect-types`). The code is
/// immutable once created; online-only write.
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
        NavigationStack {
            Form {
                Section {
                    LabeledField(i18n.t("qc.lookupCode"), text: $code, mono: true)
                        .disabled(editing)
                    LabeledField(i18n.t("qc.lookupLabel"), text: $label)
                    LabeledField(i18n.t("qc.sortOrder"), text: $sortOrder, keyboard: .numberPad)
                    if editing { Toggle(i18n.t("qc.active"), isOn: $isActive) }
                }
                if let error {
                    Section { Text(error).foregroundStyle(Tokens.danger).font(.footnote) }
                }
            }
            .navigationTitle(i18n.t(kind == "grades" ? "qc.grades" : "qc.defectTypes"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save")) { Task { await submit() } }.disabled(busy)
                }
            }
            .onAppear(perform: hydrate)
        }
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
        let repo = QcRepository(api: ProcApi(container))
        do {
            if let existing {
                try await repo.updateLookup(kind, existing.code, LookupWriteDTO(
                    code: nil, label: label.trimmed, sortOrder: Int(sortOrder.trimmed), isActive: isActive))
            } else {
                try await repo.createLookup(kind, LookupWriteDTO(
                    code: code.trimmed, label: label.trimmed, sortOrder: Int(sortOrder.trimmed), isActive: nil))
            }
            dismiss()
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("qc.codeDuplicate") : e.message
        } catch let other {
            error = other.localizedDescription
        }
    }
}
