import SwiftUI

/// Post-checkout receipt, built from the local `CompletedSale` so it renders
/// identically online and offline. A queued sale shows a "pending sync" badge.
/// Copy-to-clipboard and 58mm system print both work.
struct PosReceiptSheet: View {
    let sale: CompletedSale
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if sale.pending {
                        StatusBadge(i18n.t("common.offline", default: "Pending sync"),
                                    color: Tokens.warning)
                    }
                    AppCard { paper }
                    actions
                }
                .frame(maxWidth: 360)
                .padding()
                .frame(maxWidth: .infinity)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(i18n.t("pos.receiptTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
        }
    }

    private var paper: some View {
        VStack(spacing: 6) {
            Text(i18n.t("pos.storeName")).font(.mono(13, weight: .bold))
            Text(i18n.t("pos.storeLocation")).font(.mono(11))
            rule
            row(i18n.t("pos.receiptNumber"), sale.receiptId)
            row(i18n.t("pos.soldAt"), Self.dateTime(sale.soldAt))
            row(i18n.t("pos.cashier"), sale.cashier)
            if let name = sale.customerName { row(i18n.t("sales.customer"), name) }
            rule
            Text(sale.modelLabel).font(.mono(12))
            Text(sale.imei).font(.mono(10))
            rule
            row(i18n.t("pos.totalDue"), MoneyText.format(sale.salePrice), bold: true)
            if let endsAt = sale.warrantyEndsAt {
                row(i18n.t("pos.warrantyUntil"), Self.date(endsAt))
            }
            Text(i18n.t("pos.thankYou")).font(.mono(11)).padding(.top, 6)
        }
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }

    private var actions: some View {
        VStack(spacing: 10) {
            Button {
                ReceiptPrinting.copy(receiptText)
            } label: {
                Label(i18n.t("pos.copyCheque"), systemImage: "doc.on.doc")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)

            Button {
                ReceiptPrinting.print(receiptText, jobName: i18n.t("pos.receiptTitle"))
            } label: {
                Label(i18n.t("pos.printCheque"), systemImage: "printer")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)

            Button {
                dismiss()
            } label: {
                Label(i18n.t("pos.newSale"), systemImage: "plus")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
    }

    private var receiptText: String {
        [
            i18n.t("pos.storeName"),
            "\(i18n.t("pos.receiptNumber")): \(sale.receiptId)",
            "\(sale.modelLabel) (\(sale.imei))",
            "\(i18n.t("pos.totalDue")): \(MoneyText.format(sale.salePrice))",
            i18n.t("pos.thankYou"),
        ].joined(separator: "\n")
    }

    private func row(_ label: String, _ value: String, bold: Bool = false) -> some View {
        HStack(alignment: .top) {
            Text(label).font(.mono(11))
            Spacer(minLength: 8)
            Text(value).font(.mono(11, weight: bold ? .bold : .regular))
                .multilineTextAlignment(.trailing)
        }
    }

    private var rule: some View {
        Text(String(repeating: "-", count: 30)).font(.mono(11))
    }

    static func dateTime(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd HH:mm"
        return f.string(from: date)
    }

    static func date(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}
