import SwiftUI

/// Scan an IMEI → warranty status + a return action. Works offline from the
/// cached device + latest sale.
struct WarrantyLookupSheet: View {
    let onChanged: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var model = WarrantyModel()
    @State private var showReturn = false
    @State private var copied = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    ScannerField(placeholder: i18n.t("catalog.scanCode")) { code in
                        model.lookup(code)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                }

                if model.loading {
                    Section {
                        HStack(spacing: 12) {
                            ProgressView()
                            Text(i18n.t("common.loading", default: "Looking up warranty..."))
                                .font(.subheadline)
                                .foregroundStyle(Tokens.muted)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 20)
                    }
                } else if model.notFound {
                    Section {
                        EmptyStateView(systemImage: "magnifyingglass",
                                       title: i18n.t("common.notFound", default: "No Warranty Record"),
                                       message: i18n.t("sales.noWarrantyFound", default: "No sale found for this IMEI."))
                    }
                } else if let result = model.result {
                    resultSection(result)
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle(i18n.t("sales.warrantyLookup", default: "Warranty Lookup"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close", default: "Close")) { dismiss() }
                }
            }
            .sheet(isPresented: $showReturn) {
                if let result = model.result {
                    ReturnSheet(saleId: result.saleId) {
                        onChanged()
                        model.clear()
                    }
                }
            }
            .task { model.configure(container) }
        }
    }

    @ViewBuilder private func resultSection(_ r: WarrantyLookup) -> some View {
        // Status Hero Banner
        Section {
            HStack(spacing: 14) {
                Image(systemName: r.active ? "checkmark.shield.fill" : "xmark.shield.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(r.active ? Tokens.success : Tokens.danger)

                VStack(alignment: .leading, spacing: 3) {
                    Text(r.active ? i18n.t("sales.warrantyValid", default: "Warranty Active") : i18n.t("sales.warrantyExpired", default: "Warranty Expired"))
                        .font(.headline.weight(.bold))
                        .foregroundStyle(r.active ? Tokens.success : Tokens.danger)

                    Text(r.active
                         ? i18n.t("sales.daysRemaining", default: "\(r.remainingDays) days remaining")
                         : i18n.t("sales.expired", default: "Coverage period has ended"))
                        .font(.subheadline)
                        .foregroundStyle(Tokens.muted)
                }
            }
            .padding(.vertical, 6)
        }

        // Details
        Section(i18n.t("sales.deviceDetails", default: "Device & Sale")) {
            HStack {
                Text(i18n.t("catalog.unitCode"))
                Spacer()
                HStack(spacing: 6) {
                    Text(r.unitCode)
                        .font(.mono(13))
                        .foregroundStyle(Tokens.ink)
                    Button {
                        UIPasteboard.general.string = r.unitCode
                        Haptic.tick.play()
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

            LabeledContent(i18n.t("sales.salePrice", default: "Sale Price")) {
                MoneyText(value: r.salePrice.string, size: 14)
                    .foregroundStyle(Tokens.ink)
            }

            if let grade = r.grade {
                LabeledContent(i18n.t("nav.qc", default: "QC Grade")) {
                    Text(grade)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Tokens.ink)
                }
            }
        }

        // Action
        Section {
            if r.alreadyReturned {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(Tokens.warning)
                    Text(i18n.t("sales.alreadyReturned", default: "Device has already been returned and refunded."))
                        .font(.footnote)
                        .foregroundStyle(Tokens.muted)
                }
                .padding(.vertical, 4)
            } else if container.session.can("sale.return") {
                Button(role: .destructive) {
                    Haptic.tick.play()
                    showReturn = true
                } label: {
                    Label(i18n.t("sales.returnDevice", default: "Process Return / Refund"), systemImage: "arrow.uturn.backward")
                        .font(.headline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 24)
                }
                .buttonStyle(.borderedProminent)
                .tint(Tokens.danger)
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)
            }
        }
    }
}
