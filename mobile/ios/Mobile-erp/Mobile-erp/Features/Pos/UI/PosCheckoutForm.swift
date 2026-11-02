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

    private static let warrantyPresets = [30, 90, 180, 365]

    private var priceValid: Bool { moneyToDouble(price) > 0 }

    var body: some View {
        Section(i18n.t("pos.salePrice", default: "Sale Price")) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("$")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.secondary)
                TextField("0", text: $price)
                    .font(.mono(24, weight: .bold))
                    .keyboardType(.decimalPad)
                    .monospacedDigit()
                if let target = device.targetPrice, price != target {
                    Spacer()
                    Button {
                        price = target
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    } label: {
                        Text(i18n.t("pos.resetToTarget", default: "Target: \(MoneyText.format(target))"))
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(Tokens.signalBlue)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Tokens.signalBlue.opacity(0.12), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 2)
        }

        Section(i18n.t("pos.warrantyDays", default: "Warranty")) {
            HStack(spacing: 8) {
                ForEach(Self.warrantyPresets, id: \.self) { days in
                    let isSelected = warranty == String(days)
                    Button {
                        warranty = String(days)
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    } label: {
                        Text("\(days)d")
                            .font(.caption.weight(isSelected ? .bold : .medium))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(
                                isSelected ? Tokens.ink : Color(.tertiarySystemFill),
                                in: Capsule()
                            )
                            .foregroundStyle(isSelected ? Color(.systemBackground) : Color.primary)
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
                TextField("Days", text: $warranty)
                    .keyboardType(.numberPad)
                    .font(.mono(14))
                    .multilineTextAlignment(.trailing)
                    .frame(width: 60)
            }
            .padding(.vertical, 2)
        }

        Section(i18n.t("pos.customer", default: "Customer")) {
            Toggle(i18n.t("pos.newCustomer", default: "Record Customer"), isOn: $addCustomer)
                .animation(.snappy, value: addCustomer)
            if addCustomer {
                HStack(spacing: 8) {
                    Image(systemName: "person").foregroundStyle(.secondary).frame(width: 20)
                    TextField(i18n.t("pos.customerName", default: "Customer name"), text: $customerName)
                        .textContentType(.name)
                }
                HStack(spacing: 8) {
                    Image(systemName: "phone").foregroundStyle(.secondary).frame(width: 20)
                    TextField(i18n.t("pos.customerPhone", default: "Phone number"), text: $customerPhone)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                }
            }
        }

        Section {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "note.text").foregroundStyle(.secondary).frame(width: 20).padding(.top, 2)
                TextField(i18n.t("pos.notes", default: "Notes (optional)"), text: $notes, axis: .vertical)
                    .lineLimit(1...3)
            }
        }

        Section {
            Button(action: submit) {
                if model.busy {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Label(i18n.t("pos.checkoutButton", default: "Complete Sale"), systemImage: "checkmark.circle.fill")
                        .font(.headline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 24)
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Tokens.ink)
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
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        model.checkout(
            salePrice: price,
            warrantyDays: Int(warranty.trimmingCharacters(in: .whitespaces)),
            customerName: addCustomer ? customerName : nil,
            customerPhone: addCustomer ? customerPhone : nil,
            notes: notes
        )
    }
}
