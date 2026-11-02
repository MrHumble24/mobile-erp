import SwiftUI

/// Detail for one sale. Links to the printable receipt and the return flow.
/// Cost/profit rows appear only when the server included them (redacted for
/// under-privileged users).
struct SaleDetailSheet: View {
    let sale: SaleView
    let onChanged: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var showReceipt = false
    @State private var showReturn = false

    private var canReturn: Bool { container.session.can("sale.return") }

    var body: some View {
        NavigationStack {
            Form {
                Section(i18n.t("sales.deviceSection")) {
                    LabeledContent(i18n.t("pos.deviceCard"), value: sale.device.model.label)
                    LabeledContent("IMEI") {
                        Text(sale.device.imei).font(.mono(13))
                    }
                }
                Section(i18n.t("sales.moneySection")) {
                    LabeledContent(i18n.t("sales.salePrice")) {
                        MoneyText(value: sale.salePrice.string)
                    }
                    if let net = sale.netProfit {
                        LabeledContent(i18n.t("sales.netProfit")) { MoneyText(value: net.string) }
                    }
                    LabeledContent(i18n.t("sales.soldBy"), value: sale.soldBy.name)
                    LabeledContent(i18n.t("sales.soldAt"), value: SaleDate.dayTime(sale.soldAt))
                    if let warranty = sale.warranty {
                        LabeledContent(i18n.t("sales.warranty"),
                                       value: i18n.t("sales.daysShort", ["count": String(warranty.days)]))
                    }
                }
                if let customer = sale.customer {
                    Section(i18n.t("sales.customerSection")) {
                        LabeledContent(i18n.t("sales.customer"), value: customer.name)
                        if let phone = customer.phone {
                            LabeledContent(i18n.t("common.phone"), value: phone)
                        }
                    }
                }
                Section {
                    Button {
                        showReceipt = true
                    } label: {
                        Label(i18n.t("sales.receipt"), systemImage: "receipt")
                    }
                    if canReturn {
                        Button(role: .destructive) {
                            showReturn = true
                        } label: {
                            Label(i18n.t("sales.returnDevice"), systemImage: "arrow.uturn.backward")
                        }
                    }
                }
            }
            .navigationTitle(i18n.t("sales.detailTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
            .sheet(isPresented: $showReceipt) { ReceiptSheet(saleId: sale.id) }
            .sheet(isPresented: $showReturn) {
                ReturnSheet(saleId: sale.id) {
                    onChanged()
                    dismiss()
                }
            }
        }
    }
}
