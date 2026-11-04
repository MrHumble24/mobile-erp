import SwiftUI

/// Checklist of defect types: tick the present ones, add an optional note per
/// ticked defect. Kit toggle rows; parent owns the selection + notes.
struct DefectsChecklist: View {
    @Environment(I18n.self) private var i18n
    let defectTypes: [Lookup]
    @Binding var selected: Set<String>
    @Binding var notes: [String: String]
    let hasError: Bool

    var body: some View {
        if !defectTypes.isEmpty {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(i18n.t("qc.defects"))
                    .font(.ui(.heading))
                    .foregroundStyle(hasError ? Tokens.danger : Tokens.text)
                ForEach(defectTypes) { defect in
                    Toggle(defect.label, isOn: binding(for: defect.code))
                        .font(.ui(.body))
                        .foregroundStyle(Tokens.text)
                        .frame(minHeight: Tokens.Space.minTouch)
                    if selected.contains(defect.code) {
                        AppFormField(label: i18n.t("qc.defectNotes")) {
                            AppTextField(placeholder: i18n.t("qc.defectNotes"), text: noteBinding(for: defect.code))
                        }
                        .padding(.bottom, Tokens.Space.xs)
                    }
                }
                if hasError {
                    Text(i18n.t("qc.failNeedsDefect")).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
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
