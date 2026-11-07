import SwiftUI

/// Post-checkout receipt, built from the local `CompletedSale` so it renders
/// identically online and offline. A queued sale shows a "pending sync" badge.
/// Copy-to-clipboard and 58mm system print both work.
struct PosReceiptSheet: View {
    let sale: CompletedSale
    var onNewSale: (() -> Void)? = nil

    @Environment(AppContainer.self) private var container
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
                let headers = BonusReceiptLayout.headerLines(
                    name: container.storeFlags.storeName,
                    address: container.storeFlags.storeAddress,
                    phone: container.storeFlags.storePhone
                )
                if !headers.isEmpty {
                    VStack(spacing: 2) {
                        ForEach(Array(headers.enumerated()), id: \.offset) { idx, line in
                            Text(line)
                                .font(.mono(idx == 0 ? 15 : 11, weight: idx == 0 ? .bold : .regular))
                                .foregroundStyle(idx == 0 ? Tokens.ink : Tokens.muted)
                        }
                    }
                    .padding(.bottom, 6)
                    dashedDivider
                }

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
                    Text(sale.unitCode.isEmpty ? sale.quantityLabel : sale.unitCode)
                        .font(.mono(11))
                        .foregroundStyle(Tokens.muted)
                        .frame(maxWidth: .infinity, alignment: .center)
                    if let unitPrice = sale.unitPrice {
                        Text("\(sale.quantityLabel) · \(MoneyText.format(unitPrice))")
                            .font(.mono(10))
                            .foregroundStyle(Tokens.muted)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    if let imei2 = sale.imei2, !imei2.isEmpty {
                        Text("\(i18n.t("inventory.imei2", default: "IMEI 2")): \(imei2)")
                            .font(.mono(10))
                            .foregroundStyle(Tokens.muted)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
                .padding(.vertical, 4)

                dashedDivider

                // Pricing (ADR 0034): shown only when a discount was given or the
                // level was not walk-in.
                if sale.showsPricing {
                    if sale.priceLevelCode != nil && sale.priceLevelCode != PriceLevels.retail {
                        row(i18n.t("pricing.priceLevel"), i18n.t(PriceLevels.labelKey(sale.priceLevelCode!)))
                    }
                    if let listPrice = sale.listPrice {
                        row(i18n.t("pricing.listPrice"), MoneyText.format(listPrice))
                    }
                    if let discount = sale.discountAmount {
                        row(i18n.t("pricing.discount"), "− \(MoneyText.format(discount))")
                    }
                }

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

                if let bonusSpent = sale.bonusSpent, (Decimal(string: bonusSpent) ?? 0) > 0 {
                    row(i18n.t("sales.paidWithPoints"), "− \(BonusText.format(bonusSpent))")
                }

                if let endsAt = sale.warrantyEndsAt {
                    row(i18n.t("pos.warrantyUntil", default: "Warranty until"), Self.date(endsAt))
                }

                dashedDivider

                let primaryCode = !sale.unitCode.isEmpty ? sale.unitCode : String(sale.receiptId.prefix(15))
                BarcodeVisual(value: primaryCode)
                    .padding(.top, 4)

                Text(i18n.t("pos.thankYou", default: "Thank you for your purchase!"))
                    .font(.mono(11))
                    .foregroundStyle(Tokens.muted)
                    .padding(.top, 2)

                if let footer = container.storeFlags.receiptFooter?.trimmingCharacters(in: .whitespacesAndNewlines), !footer.isEmpty {
                    Text(footer)
                        .font(.mono(11))
                        .foregroundStyle(Tokens.muted)
                        .padding(.top, 4)
                }
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
                    let width = BonusReceiptLayout.lineWidth(for: container.storeFlags.receiptPaperWidthMm)
                    ReceiptPrinting.copy(receiptText(width: width))
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

                if container.storeFlags.receiptPrintingEnabled {
                    Button {
                        let width = BonusReceiptLayout.lineWidth(for: container.storeFlags.receiptPaperWidthMm)
                        ReceiptPrinting.print(receiptText(width: width), jobName: i18n.t("pos.receiptTitle", default: "Receipt"))
                        Haptic.tick.play()
                    } label: {
                        Label(i18n.t("sales.printReceipt", default: "Print"), systemImage: "printer")
                            .font(.subheadline.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .frame(height: 22)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }

    private func receiptText(width: Int) -> String {
        var lines: [String] = []
        let headers = BonusReceiptLayout.headerLines(
            name: container.storeFlags.storeName,
            address: container.storeFlags.storeAddress,
            phone: container.storeFlags.storePhone
        )
        lines.append(contentsOf: headers)
        if !headers.isEmpty {
            lines.append(BonusReceiptLayout.rule(width: width))
        }
        lines.append(BonusReceiptLayout.row(i18n.t("pos.receiptNumber", default: "Receipt #"), sale.receiptId.prefix(8).uppercased(), width: width))
        lines.append(BonusReceiptLayout.row(i18n.t("pos.soldAt", default: "Date/Time"), Self.dateTime(sale.soldAt), width: width))
        lines.append(BonusReceiptLayout.row(i18n.t("pos.cashier", default: "Cashier"), sale.cashier, width: width))
        if let name = sale.customerName {
            lines.append(BonusReceiptLayout.row(i18n.t("sales.customer", default: "Customer"), name, width: width))
        }
        lines.append(BonusReceiptLayout.rule(width: width))
        lines.append("\(sale.modelLabel) (\(sale.unitCode.isEmpty ? sale.quantityLabel : sale.unitCode))")
        lines.append(BonusReceiptLayout.rule(width: width))
        lines.append(BonusReceiptLayout.row(i18n.t("pos.totalDue", default: "TOTAL"), MoneyText.format(sale.salePrice), width: width))
        if let bonusSpent = sale.bonusSpent, (Decimal(string: bonusSpent) ?? 0) > 0 {
            lines.append(BonusReceiptLayout.row(i18n.t("sales.paidWithPoints"), "− \(BonusText.format(bonusSpent))", width: width))
        }
        if let endsAt = sale.warrantyEndsAt {
            lines.append(BonusReceiptLayout.row(i18n.t("pos.warrantyUntil", default: "Warranty"), Self.date(endsAt), width: width))
        }
        lines.append(BonusReceiptLayout.rule(width: width))
        lines.append(i18n.t("pos.thankYou", default: "Thank you!"))
        if let footer = container.storeFlags.receiptFooter?.trimmingCharacters(in: .whitespacesAndNewlines), !footer.isEmpty {
            lines.append(footer)
        }
        return lines.joined(separator: "\n")
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
