import SwiftUI

/// Post-checkout receipt, built from the local `CompletedSale` so it renders
/// identically online and offline. A queued sale shows a "pending sync" badge.
/// Copy-to-clipboard and 58mm system print both work.
struct PosReceiptSheet: View {
    let sale: CompletedSale
    var onNewSale: (() -> Void)? = nil

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var copied = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if sale.pending {
                        StatusBadge(i18n.t("common.offline", default: "Pending sync"),
                                    color: Tokens.warning)
                            .padding(.top, 4)
                    }

                    paperCard

                    actions
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 20)
                .frame(maxWidth: .infinity)
            }
            .background(Tokens.bg)
            .navigationTitle(i18n.t("pos.receiptTitle", default: "Receipt"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close", default: "Close")) { dismiss() }
                }
            }
        }
    }

    private var paperCard: some View {
        VStack(spacing: 0) {
            // Receipt Content
            VStack(spacing: 8) {
                // Store Header
                VStack(spacing: 2) {
                    Text(i18n.t("pos.storeName"))
                        .font(.mono(15, weight: .bold))
                        .foregroundStyle(Tokens.ink)
                    Text(i18n.t("pos.storeLocation"))
                        .font(.mono(11))
                        .foregroundStyle(Tokens.muted)
                }
                .padding(.bottom, 6)

                dashedDivider

                // Metadata Rows
                Group {
                    row(i18n.t("pos.receiptNumber", default: "Receipt #"), sale.receiptId.prefix(8).uppercased())
                    row(i18n.t("pos.soldAt", default: "Date/Time"), Self.dateTime(sale.soldAt))
                    row(i18n.t("pos.cashier", default: "Cashier"), sale.cashier)
                    if let name = sale.customerName {
                        row(i18n.t("sales.customer", default: "Customer"), name)
                    }
                }

                dashedDivider

                // Device Item
                VStack(spacing: 2) {
                    Text(sale.modelLabel)
                        .font(.mono(13, weight: .semibold))
                        .foregroundStyle(Tokens.ink)
                        .frame(maxWidth: .infinity, alignment: .center)
                    Text(sale.unitCode)
                        .font(.mono(11))
                        .foregroundStyle(Tokens.muted)
                        .frame(maxWidth: .infinity, alignment: .center)
                    if let imei2 = sale.imei2, !imei2.isEmpty {
                        Text("\(i18n.t("inventory.imei2", default: "IMEI 2")): \(imei2)")
                            .font(.mono(10))
                            .foregroundStyle(Tokens.muted)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
                .padding(.vertical, 4)

                dashedDivider

                // Financial Total
                HStack(alignment: .firstTextBaseline) {
                    Text(i18n.t("pos.totalDue", default: "TOTAL DUE"))
                        .font(.mono(14, weight: .bold))
                        .foregroundStyle(Tokens.ink)
                    Spacer()
                    Text(MoneyText.format(sale.salePrice))
                        .font(.mono(20, weight: .bold))
                        .foregroundStyle(Tokens.ink)
                }
                .padding(.vertical, 4)

                if let endsAt = sale.warrantyEndsAt {
                    row(i18n.t("pos.warrantyUntil", default: "Warranty until"), Self.date(endsAt))
                }

                dashedDivider

                Text(i18n.t("pos.thankYou", default: "Thank you for your purchase!"))
                    .font(.mono(11))
                    .foregroundStyle(Tokens.muted)
                    .padding(.top, 4)
            }
            .padding(20)
            .background(Tokens.surface)
            .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous)
                    .strokeBorder(Tokens.hairline, lineWidth: 1)
            )
        }
    }

    private var dashedDivider: some View {
        Rectangle()
            .stroke(style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
            .frame(height: 1)
            .foregroundStyle(Tokens.hairline)
            .padding(.vertical, 4)
    }

    private var actions: some View {
        VStack(spacing: 12) {
            Button {
                onNewSale?()
                dismiss()
            } label: {
                Label(i18n.t("pos.newSale", default: "New Sale"), systemImage: "plus.circle.fill")
                    .font(.headline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 24)
            }
            .buttonStyle(.borderedProminent)
            .foregroundStyle(Tokens.onInk)
            .tint(Tokens.ink)

            HStack(spacing: 12) {
                Button {
                    ReceiptPrinting.copy(receiptText)
                    Haptic.tick.play()
                    withAnimation(.snappy(duration: 0.2)) { copied = true }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        withAnimation { copied = false }
                    }
                } label: {
                    Label(copied ? i18n.t("common.copied", default: "Copied!") : i18n.t("pos.copyCheque", default: "Copy Receipt"),
                          systemImage: copied ? "checkmark" : "doc.on.doc")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(copied ? Tokens.success : Color.primary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 22)
                }
                .buttonStyle(.bordered)

                Button {
                    ReceiptPrinting.print(receiptText, jobName: i18n.t("pos.receiptTitle", default: "Receipt"))
                    Haptic.tick.play()
                } label: {
                    Label(i18n.t("pos.printCheque", default: "Print 58mm"), systemImage: "printer")
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity)
                        .frame(height: 22)
                }
                .buttonStyle(.bordered)
            }
        }
    }

    private var receiptText: String {
        [
            i18n.t("pos.storeName"),
            "\(i18n.t("pos.receiptNumber", default: "Receipt #")): \(sale.receiptId.prefix(8).uppercased())",
            "\(sale.modelLabel) (\(sale.unitCode))",
            "\(i18n.t("pos.totalDue", default: "TOTAL")): \(MoneyText.format(sale.salePrice))",
            sale.warrantyEndsAt.map { "\(i18n.t("pos.warrantyUntil", default: "Warranty")): \(Self.date($0))" } ?? "",
            i18n.t("pos.thankYou", default: "Thank you!"),
        ].filter { !$0.isEmpty }.joined(separator: "\n")
    }

    private func row(_ label: String, _ value: String, bold: Bool = false) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.mono(11))
                .foregroundStyle(Tokens.muted)
            Spacer(minLength: 8)
            Text(value)
                .font(.mono(11, weight: bold ? .bold : .medium))
                .foregroundStyle(Tokens.ink)
                .multilineTextAlignment(.trailing)
        }
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
