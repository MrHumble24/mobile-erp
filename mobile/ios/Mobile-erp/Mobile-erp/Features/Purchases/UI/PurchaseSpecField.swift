import SwiftUI

/// One model-attribute input on the buy sheet, chosen by attribute type
/// (select → `AppSelect`, else a text/number field). Slice-local so Purchases
/// does not depend on the Procurement intake form.
struct PurchaseSpecField: View {
    let attr: PurchaseAttr
    @Binding var value: String

    private var label: String { attr.required ? "\(attr.label) *" : attr.label }

    var body: some View {
        AppFormField(label: label) {
            if attr.type == "select", !attr.options.isEmpty {
                AppSelect(placeholder: "—", selection: $value,
                          options: [("", "—")] + attr.options.map { ($0, $0) })
            } else {
                AppTextField(placeholder: attr.label, text: $value,
                             keyboard: attr.type == "number" ? .numberPad : .default)
            }
        }
    }
}
