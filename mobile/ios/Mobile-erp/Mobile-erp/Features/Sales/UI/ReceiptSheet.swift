import SwiftUI

/// 58mm printable receipt for one sale. Fetches the server `ReceiptView` (no
/// cost/profit, ever) and renders it monospaced. Copy + system print both work.
struct ReceiptSheet: View {
    let saleId: String
    /// Tender lines from the sale view; the server receipt has no payments, so
    /// they ride in from the detail. Empty → the paid-with block is hidden.
    var payments: [SalePaymentLine] = []
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var receipt: ReceiptView?
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if let receipt {
                    ScrollView {
                        VStack(spacing: 16) {
                            AppCard { paper(receipt) }
                            actions(receipt)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 20)
                        .frame(maxWidth: .infinity)
                    }
                    .background(Tokens.bg)
                } else if let error {
                    ErrorStateView(message: error) { load() }
                } else {
                    LoadingView()
                }
            }
            .navigationTitle(i18n.t("sales.receipt"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
            .task { if receipt == nil { load() } }
        }
    }

    private func paper(_ r: ReceiptView) -> some View {
        VStack(spacing: 6) {
            Text(i18n.t("pos.storeName")).font(.mono(13, weight: .bold))
            Text(i18n.t("pos.storeLocation")).font(.mono(11))
            rule
            row(i18n.t("pos.receiptNumber"), r.saleId)
            row(i18n.t("pos.soldAt"), SaleDate.dayTime(r.soldAt))
            row(i18n.t("pos.cashier"), r.cashier)
            if let customer = r.customer { row(i18n.t("sales.customer"), customer.name) }
            rule
            ForEach(Array(r.items.enumerated()), id: \.offset) { _, item in
                VStack(spacing: 2) {
                    Text(item.model).font(.mono(12))
                    Text(item.unitCode).font(.mono(10))
                    if let imei2 = item.imei2, !imei2.isEmpty {
                        Text("\(i18n.t("inventory.imei2", default: "IMEI 2")): \(imei2)").font(.mono(10))
                    }
                    row(subtitle(item), MoneyText.format(item.price.string))
                }
            }
            rule
            row(i18n.t("pos.totalDue"), MoneyText.format(r.total.string), bold: true)
            if !payments.isEmpty {
                ForEach(payments) { p in
                    row(PaymentAccounts.label(p.accountCode, i18n), MoneyText.format(p.amount.string))
                }
            }
            if let w = r.warranty, let endsAt = w.endsAt {
                row(i18n.t("pos.warrantyUntil"), SaleDate.day(endsAt))
            }
            Text(i18n.t("pos.thankYou")).font(.mono(11)).padding(.top, 6)
            Text(i18n.t("pos.warrantyNotice")).font(.mono(9)).foregroundStyle(Tokens.muted)
        }
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }

    private func actions(_ r: ReceiptView) -> some View {
        VStack(spacing: 10) {
            Button {
                SalesReceiptPrinting.copy(text(r))
            } label: {
                Label(i18n.t("pos.copyCheque"), systemImage: "doc.on.doc").frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            Button {
                SalesReceiptPrinting.print(text(r), jobName: i18n.t("sales.receipt"))
            } label: {
                Label(i18n.t("sales.printReceipt"), systemImage: "printer").frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .foregroundStyle(Tokens.onInk)
        }
    }

    private func subtitle(_ item: ReceiptView.Item) -> String {
        [item.storage, item.color].compactMap { $0 }.joined(separator: " · ")
    }

    private func text(_ r: ReceiptView) -> String {
        var lines = [
            i18n.t("pos.storeName"),
            i18n.t("pos.storeLocation"),
            "\(i18n.t("pos.receiptNumber")): \(r.saleId)",
            "\(i18n.t("pos.cashier")): \(r.cashier)",
            String(repeating: "-", count: 30),
        ]
        lines += r.items.map { "\($0.model) (\($0.unitCode))  \(MoneyText.format($0.price.string))" }
        lines.append(String(repeating: "-", count: 30))
        lines.append("\(i18n.t("pos.totalDue")): \(MoneyText.format(r.total.string))")
        lines.append(i18n.t("pos.thankYou"))
        return lines.joined(separator: "\n")
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

    private func load() {
        error = nil
        let repo = SalesRepository(api: container.api, context: container.modelContext)
        Task {
            do { receipt = try await repo.receipt(saleId) }
            catch let e as AppError { error = e.message }
            catch { self.error = error.localizedDescription }
        }
    }
}
