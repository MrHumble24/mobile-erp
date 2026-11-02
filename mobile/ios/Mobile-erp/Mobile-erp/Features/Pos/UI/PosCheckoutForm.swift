import SwiftUI

/// Checkout fields for the scanned device: sale price (prefilled from the target
/// price), an optional inline new customer, warranty days (prefilled from
/// settings), and notes. Renders as `Form` sections inside `PosView`.
struct PosCheckoutForm: View {
    let device: ScannedDevice
    let model: PosViewModel
    @Environment(I18n.self) private var i18n

    @State private var price = ""
    @State private var warranty = ""
    @State private var addCustomer = false
    @State private var customerName = ""
    @State private var customerPhone = ""
    @State private var notes = ""
    @State private var didPrefill = false

    private var priceValid: Bool { moneyToDouble(price) > 0 }

    var body: some View {
        Section(i18n.t("pos.salePrice")) {
            TextField(i18n.t("pos.salePrice"), text: $price)
                .keyboardType(.decimalPad)
                .font(.mono(16))
            TextField(i18n.t("pos.warrantyDays"), text: $warranty)
                .keyboardType(.numberPad)
        }

        Section(i18n.t("pos.customer")) {
            Toggle(i18n.t("pos.newCustomer"), isOn: $addCustomer)
            if addCustomer {
                TextField(i18n.t("pos.customerName"), text: $customerName)
                TextField(i18n.t("pos.customerPhone"), text: $customerPhone)
                    .keyboardType(.phonePad)
            }
        }

        Section {
            TextField(i18n.t("pos.notes"), text: $notes, axis: .vertical)
                .lineLimit(1...3)
        }

        Section {
            Button(action: submit) {
                if model.busy {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Label(i18n.t("pos.checkoutButton"), systemImage: "checkmark.circle")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(model.busy || !priceValid || (addCustomer && nonEmpty(customerName) == nil))
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
        }
        .onAppear(perform: prefill)
        .onChange(of: model.defaultWarrantyDays) { _, _ in prefill() }
    }

    private func prefill() {
        if price.isEmpty, let target = device.targetPrice { price = target }
        if !didPrefill, warranty.isEmpty, let days = model.defaultWarrantyDays {
            warranty = String(days)
            didPrefill = true
        }
    }

    private func submit() {
        guard priceValid, !model.busy else { return }
        model.checkout(
            salePrice: price,
            warrantyDays: Int(warranty.trimmingCharacters(in: .whitespaces)),
            customerName: addCustomer ? customerName : nil,
            customerPhone: addCustomer ? customerPhone : nil,
            notes: notes
        )
    }
}
