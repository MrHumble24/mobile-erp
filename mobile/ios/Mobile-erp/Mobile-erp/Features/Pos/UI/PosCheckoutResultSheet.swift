import SwiftUI

/// After a multi-device checkout: one row per completed sale (tap to open its
/// printable receipt), with a pending-sync badge for queued lines. "New sale"
/// dismisses and resets for the next cart.
struct PosCheckoutResultSheet: View {
    let sales: [CompletedSale]
    let onDone: () -> Void
    @Environment(I18n.self) private var i18n
    @State private var receipt: CompletedSale?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(sales) { sale in
                        Button { receipt = sale } label: { row(sale) }
                            .buttonStyle(.plain)
                    }
                }
            }
            .navigationTitle(i18n.t("pos.saleSuccess", ["count": String(sales.count)]))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("pos.newSale"), action: onDone)
                }
            }
            .sheet(item: $receipt) { PosReceiptSheet(sale: $0) }
        }
    }

    private func row(_ sale: CompletedSale) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(sale.modelLabel).font(.body.weight(.medium))
                Spacer()
                MoneyText(value: sale.salePrice)
            }
            Text(sale.unitCode.isEmpty ? sale.quantityLabel : sale.unitCode)
                .font(.mono(12)).foregroundStyle(Tokens.muted)
            if let imei2 = sale.imei2, !imei2.isEmpty {
                Text("\(i18n.t("inventory.imei2", default: "IMEI 2")): \(imei2)")
                    .font(.mono(11)).foregroundStyle(.tertiary)
            }
            HStack(spacing: 8) {
                Label(i18n.t("pos.printReceipt"), systemImage: "receipt")
                    .font(.caption).foregroundStyle(Tokens.signalBlue)
                Spacer()
                if sale.pending {
                    StatusBadge(i18n.t("common.offline", default: "Pending sync"), color: Tokens.warning)
                }
            }
        }
        .padding(.vertical, 2)
    }
}
