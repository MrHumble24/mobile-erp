import SwiftUI

/// Renders one input per model attribute (sorted by order), bound to a `specs`
/// map the parent owns. `select` with options → Picker; a `select` whose option
/// list is still empty (the server's default storage/color scaffold, or a list
/// the owner has not filled yet) falls back to a text field — the server accepts
/// any value for an option-less select, and a picker offering only "—" would
/// block the save. `number` → decimal field, else text. Rendered as Form rows.
struct DynamicSpecFields: View {
    let attributes: [AttributeDef]
    @Binding var specs: [String: String]

    private var sorted: [AttributeDef] {
        attributes.sorted { $0.sortOrder < $1.sortOrder }
    }

    var body: some View {
        ForEach(sorted) { attr in
            let label = attr.required ? "\(attr.label) *" : attr.label
            switch attr.type {
            case .select where !attr.options.isEmpty:
                Picker(label, selection: binding(attr.key)) {
                    Text("—").tag("")
                    ForEach(attr.options, id: \.self) { Text($0).tag($0) }
                }
            case .number:
                let b = binding(attr.key)
                TextField(label, text: b)
                    .keyboardType(.decimalPad)
                    .sanitizeDecimal(b)
            case .text, .select:
                TextField(label, text: binding(attr.key))
            }
        }
    }

    private func binding(_ key: String) -> Binding<String> {
        Binding(get: { specs[key] ?? "" }, set: { specs[key] = $0 })
    }
}
