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
    @State private var copied = false

    private var canReturn: Bool { container.session.can("sale.return") }

    var body: some View {
        NavigationStack {
            Form {
                // 1. Device Section
                Section(i18n.t("sales.deviceSection", default: "Sold Device")) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(sale.device.model.label)
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(Tokens.ink)

                        HStack(spacing: 8) {
                            Text("IMEI: \(sale.device.imei)")
                                .font(.mono(13, weight: .medium))
                                .foregroundStyle(.secondary)
                            Button {
                                UIPasteboard.general.string = sale.device.imei
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                withAnimation(.snappy(duration: 0.2)) { copied = true }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                    withAnimation { copied = false }
                                }
                            } label: {
                                Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                    .font(.system(size: 11))
                                    .foregroundStyle(copied ? Tokens.success : .secondary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // 2. Financial & Sale Information
                Section(i18n.t("sales.moneySection", default: "Financial Summary")) {
                    LabeledContent(i18n.t("sales.salePrice", default: "Sale Price")) {
                        MoneyText(value: sale.salePrice.string, size: 18)
                            .foregroundStyle(Tokens.ink)
                    }

                    if let net = sale.netProfit {
                        LabeledContent(i18n.t("sales.netProfit", default: "Net Margin")) {
                            MoneyText(value: net.string, size: 16)
                                .foregroundStyle(Tokens.success)
                        }
                    }

                    LabeledContent(i18n.t("sales.soldBy", default: "Cashier"), value: sale.soldBy.name)
                    LabeledContent(i18n.t("sales.soldAt", default: "Date/Time"), value: SaleDate.dayTime(sale.soldAt))

                    if let warranty = sale.warranty {
                        HStack {
                            Label(i18n.t("sales.warranty", default: "Warranty Coverage"), systemImage: "shield.fill")
                                .foregroundStyle(Tokens.success)
                            Spacer()
                            Text(i18n.t("sales.daysShort", ["count": String(warranty.days)]))
                                .font(.subheadline.weight(.medium))
                        }
                    }
                }

                // 3. Customer Information (if present)
                if let customer = sale.customer {
                    Section(i18n.t("sales.customerSection", default: "Customer")) {
                        LabeledContent(i18n.t("sales.customer", default: "Name"), value: customer.name)
                        if let phone = customer.phone {
                            HStack {
                                Text(i18n.t("common.phone", default: "Phone"))
                                Spacer()
                                Link(phone, destination: URL(string: "tel:\(phone)")!)
                                    .font(.subheadline.weight(.medium))
                            }
                        }
                    }
                }

                // 4. Actions
                Section {
                    Button {
                        container.router.open(.inventory(imei: sale.device.imei))
                        dismiss()
                    } label: {
                        Label(i18n.t("sales.openDevice"), systemImage: "externaldrive")
                    }
                    if let consignmentId = sale.consignmentId {
                        Button {
                            container.router.open(.consignments(id: consignmentId))
                            dismiss()
                        } label: {
                            Label(i18n.t("sales.viewConsignment"), systemImage: "arrow.left.arrow.right")
                        }
                    }
                    Button {
                        showReceipt = true
                    } label: {
                        Label(i18n.t("sales.receipt", default: "View & Print Receipt"), systemImage: "receipt")
                            .font(.headline.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .frame(height: 24)
                    }
                    .buttonStyle(.borderedProminent)
                    .foregroundStyle(Tokens.onInk)
                    .tint(Tokens.ink)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)

                    if canReturn {
                        Button(role: .destructive) {
                            showReturn = true
                        } label: {
                            Label(i18n.t("sales.returnDevice", default: "Process Return / Refund"), systemImage: "arrow.uturn.backward")
                                .font(.subheadline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                                .frame(height: 22)
                        }
                        .buttonStyle(.bordered)
                        .tint(Tokens.danger)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                        .padding(.top, 4)
                    }
                }
            }
            .navigationTitle(i18n.t("sales.detailTitle", default: "Sale Details"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.close", default: "Close")) { dismiss() }
                }
            }
            .sheet(isPresented: $showReceipt) { ReceiptSheet(saleId: sale.id) }
            .sheet(isPresented: $showReturn) {
                ReturnSheet(saleId: sale.id) {
                    container.toasts.success(i18n.t("sales.returnSuccess"))
                    onChanged()
                    dismiss()
                }
            }
        }
    }
}
