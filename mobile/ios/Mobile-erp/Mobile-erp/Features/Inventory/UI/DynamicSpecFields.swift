import SwiftUI

/// Renders one input per model attribute (sorted by order), bound to a `specs`
/// map the parent owns. `select` → Picker, `number` → decimal field, else text.
/// Schema comes from the device model (ADR 0013). Rendered as Form rows.
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
            case .select:
                Picker(label, selection: binding(attr.key)) {
                    Text("—").tag("")
                    ForEach(attr.options, id: \.self) { Text($0).tag($0) }
                }
            case .number:
                TextField(label, text: binding(attr.key))
                    .keyboardType(.decimalPad)
            case .text:
                TextField(label, text: binding(attr.key))
            }
        }
    }

    private func binding(_ key: String) -> Binding<String> {
        Binding(get: { specs[key] ?? "" }, set: { specs[key] = $0 })
    }
}
