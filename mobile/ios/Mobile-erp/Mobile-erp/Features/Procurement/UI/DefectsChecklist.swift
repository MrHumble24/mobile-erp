import SwiftUI

/// Checklist of defect types: tick the present ones, add an optional note per
/// ticked defect. Parent owns the selection + notes.
struct DefectsChecklist: View {
    @Environment(I18n.self) private var i18n
    let defectTypes: [Lookup]
    @Binding var selected: Set<String>
    @Binding var notes: [String: String]
    let hasError: Bool

    var body: some View {
        if !defectTypes.isEmpty {
            Text(i18n.t("qc.defects"))
                .font(.caption.weight(.semibold))
                .foregroundStyle(hasError ? Tokens.danger : .secondary)

            ForEach(defectTypes) { defect in
                Toggle(defect.label, isOn: binding(for: defect.code))
                if selected.contains(defect.code) {
                    LabeledField(i18n.t("qc.defectNotes"), text: noteBinding(for: defect.code))
                        .font(.footnote)
                }
            }

            if hasError {
                Text(i18n.t("qc.failNeedsDefect")).font(.footnote).foregroundStyle(Tokens.danger)
            }
        }
    }

    private func binding(for code: String) -> Binding<Bool> {
        Binding(
            get: { selected.contains(code) },
            set: { on in if on { selected.insert(code) } else { selected.remove(code) } }
        )
    }

    private func noteBinding(for code: String) -> Binding<String> {
        Binding(get: { notes[code] ?? "" }, set: { notes[code] = $0 })
    }
}
