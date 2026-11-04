import SwiftUI

/// Consignment detail sheet: partner, device IMEI, terms, timestamps and —
/// for an OUT item — settle / return. Loads the single record online (not in
/// the sync cache); offline it shows a needs-connection notice.
struct ConsignmentDetailView: View {
    let consignmentId: String
    var onSettle: (Consignment) -> Void
    var onReturn: (Consignment) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var item: Consignment?
    @State private var loading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if let item { detail(item) }
                else if loading { LoadingView() }
                else { ErrorStateView(message: errorMessage ?? i18n.t("common.error")) }
            }
            .navigationTitle(i18n.t("consignments.detailTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
            .task { await load() }
        }
    }

    private func detail(_ c: Consignment) -> some View {
        List {
            Section {
                row(i18n.t("consignments.partner"), c.partnerShopName)
                row(i18n.t("consignments.device"), c.imei, mono: true)
                if let imei2 = c.imei2, !imei2.isEmpty {
                    row(i18n.t("inventory.imei2", default: "IMEI 2"), imei2, mono: true)
                }
                row(i18n.t("consignments.agreedPrice"), MoneyText.format(c.agreedPrice), mono: true)
                dueRow(c)
                row(i18n.t("consignments.consignedAt"), String(c.consignedAt.prefix(10)))
                if let r = c.resolvedAt { row(i18n.t("consignments.resolvedAt"), String(r.prefix(10))) }
                if let n = c.notes, !n.isEmpty { row(i18n.t("common.notes"), n) }
            }
            Section {
                Button { open(.inventory(imei: c.imei)) } label: {
                    Label(i18n.t("consignments.openDevice"), systemImage: "iphone")
                }
                if let saleId = c.saleId {
                    Button { open(.sales(saleId: saleId)) } label: {
                        Label(i18n.t("consignments.resultingSale"), systemImage: "arrow.up.right.square")
                            .foregroundStyle(Tokens.success)
                    }
                }
            }
            if c.isOut {
                Section {
                    Button { onSettle(c) } label: {
                        Label(i18n.t("consignments.settle"), systemImage: "checkmark.circle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .foregroundStyle(Tokens.onInk)
                    Button(role: .destructive) { onReturn(c) } label: {
                        Label(i18n.t("consignments.return"), systemImage: "arrow.uturn.backward")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .listRowBackground(Tokens.surface)
        .background(Tokens.bg)
    }

    private func dueRow(_ c: Consignment) -> some View {
        let overdue = ConsignmentLogic.daysOverdue(dueDate: c.dueDate, statusCode: c.statusCode)
        let text = overdue > 0
            ? "\(c.dueDate.prefix(10)) · \(overdue) \(i18n.t("consignments.daysOverdue"))"
            : String(c.dueDate.prefix(10))
        return HStack {
            Text(i18n.t("consignments.dueDate")).foregroundStyle(Tokens.muted)
            Spacer()
            Text(text).foregroundStyle(overdue > 0 ? Tokens.danger : .primary)
        }
        .font(.subheadline)
    }

    private func row(_ label: String, _ value: String, mono: Bool = false) -> some View {
        HStack {
            Text(label).foregroundStyle(Tokens.muted)
            Spacer()
            Text(value).font(mono ? .mono(14) : .subheadline).multilineTextAlignment(.trailing)
        }
        .font(.subheadline)
    }

    /// Jump to another feature (inventory / sales) and close this sheet.
    private func open(_ route: KitRoute) {
        container.router.open(route)
        dismiss()
    }

    private func load() async {
        guard item == nil else { return }
        guard container.connectivity.isOnline else {
            errorMessage = i18n.t("common.offline", default: "Connect to view this consignment.")
            return
        }
        loading = true
        defer { loading = false }
        do { item = try await container.consignmentRepository.get(consignmentId) }
        catch { errorMessage = (error as? AppError)?.message }
    }
}
