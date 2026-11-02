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

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    ScannerField(placeholder: i18n.t("sales.imeiPlaceholder")) { model.lookup($0) }
                        .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                }
                if model.loading {
                    Section { LoadingView().frame(height: 100) }
                } else if model.notFound {
                    Section {
                        EmptyStateView(systemImage: "magnifyingglass",
                                       title: i18n.t("common.notFound"))
                    }
                } else if let result = model.result {
                    resultSection(result)
                }
            }
            .navigationTitle(i18n.t("sales.warrantyLookup"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
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
        Section {
            LabeledContent("IMEI") { Text(r.imei).font(.mono(13)) }
            StatusBadge(
                r.active ? i18n.t("sales.warrantyValid") : i18n.t("sales.warrantyExpired"),
                color: r.active ? Tokens.success : Tokens.danger
            )
            LabeledContent(i18n.t("sales.salePrice")) { MoneyText(value: r.salePrice.string) }
            LabeledContent(i18n.t("sales.remainingDays"), value: String(r.remainingDays))
            if let grade = r.grade {
                LabeledContent(i18n.t("nav.qc"), value: grade)
            }
        }
        Section {
            if r.alreadyReturned {
                Text(i18n.t("sales.alreadyReturned")).foregroundStyle(.secondary)
            } else if container.session.can("sale.return") {
                Button(role: .destructive) {
                    showReturn = true
                } label: {
                    Label(i18n.t("sales.returnDevice"), systemImage: "arrow.uturn.backward")
                }
            }
        }
    }
}
