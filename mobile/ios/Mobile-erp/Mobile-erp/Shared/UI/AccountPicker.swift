import SwiftUI

/// The one account picker used wherever a single account is chosen (expenses,
/// partner payments, shipments). A Warm Card `AppSelect` over the resolved
/// `PaymentAccount` options, bound to the chosen code. Wrap it in `AppFormField`
/// for the label, like the other selects.
struct AccountPicker: View {
    let accounts: [PaymentAccount]
    @Binding var selection: String

    var body: some View {
        AppSelect(
            placeholder: accounts.first?.label ?? selection,
            selection: $selection,
            options: accounts.map { ($0.code, $0.label) }
        )
    }
}
