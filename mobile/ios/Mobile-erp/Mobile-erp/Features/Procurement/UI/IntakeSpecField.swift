import SwiftUI

/// One intake spec input, chosen by attribute type (select → Picker, else text).
struct IntakeSpecField: View {
    let attr: ProcAttributeDef
    @Binding var value: String

    private var label: String { attr.required ? "\(attr.label) *" : attr.label }

    var body: some View {
        if attr.type == "select", !attr.options.isEmpty {
            Picker(label, selection: $value) {
                Text("—").tag("")
                ForEach(attr.options, id: \.self) { Text($0).tag($0) }
            }
        } else {
            LabeledField(label, text: $value, keyboard: attr.type == "number" ? .numberPad : .default)
        }
    }
}
