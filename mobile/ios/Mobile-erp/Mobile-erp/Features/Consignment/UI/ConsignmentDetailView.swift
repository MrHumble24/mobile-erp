import SwiftUI

/// Consignment detail as a Warm Card sheet: partner title + status pill, mono
/// IMEI lines, keyed facts, ghost links (device, resulting sale) and — on an
/// OUT item — settle (the one orange) / return (destructive). Loads the single
/// record online; offline it shows a needs-connection notice.
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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: item?.partnerShopName ?? i18n.t("consignments.detailTitle")) { dismiss() }
                if let item { detail(item) }
                else if loading { LoadingView().frame(height: 160) }
                else { ErrorStateView(message: errorMessage ?? i18n.t("common.error"), retry: { Task { await load() } }) }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.large])
        .task { await load() }
    }

    @ViewBuilder private func detail(_ c: Consignment) -> some View {
        let overdue = ConsignmentLogic.daysOverdue(dueDate: c.dueDate, statusCode: c.statusCode)
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(c.unitCode).font(.data(.regular)).foregroundStyle(Tokens.text)
            if let imei2 = c.imei2, !imei2.isEmpty {
                Text(imei2).font(.data(.regular)).foregroundStyle(Tokens.muted)
            }
            StatusBadge(ConsignmentStatus.label(c.statusCode) { i18n.t($0) }, color: ConsignmentStatus.color(c.statusCode))
        }

        VStack(spacing: 0) {
            FactRow(label: i18n.t("consignments.agreedPrice")) {
                MoneyText(value: c.agreedPrice, size: 15).foregroundStyle(Tokens.text)
            }
            FactRow(label: i18n.t("consignments.dueDate")) {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(KitDate.day(c.dueDate)).font(.data(.regular)).foregroundStyle(overdue > 0 ? Tokens.danger : Tokens.text)
                    if overdue > 0 {
                        Text("\(overdue) \(i18n.t("consignments.daysOverdue"))").font(.ui(.caption)).foregroundStyle(Tokens.danger)
                    }
                }
            }
            FactRow(label: i18n.t("consignments.consignedAt"), last: c.resolvedAt == nil && (c.notes ?? "").isEmpty) {
                Text(KitDate.day(c.consignedAt)).font(.data(.regular)).foregroundStyle(Tokens.text)
            }
            if let r = c.resolvedAt {
                FactRow(label: i18n.t("consignments.resolvedAt"), last: (c.notes ?? "").isEmpty) {
                    Text(KitDate.day(r)).font(.data(.regular)).foregroundStyle(Tokens.text)
                }
            }
            if let n = c.notes, !n.isEmpty {
                FactRow(label: i18n.t("common.notes"), last: true) {
                    Text(n).font(.ui(.body)).foregroundStyle(Tokens.text)
                }
            }
        }

        VStack(spacing: Tokens.Space.sm) {
            Button { open(.inventory(imei: c.unitCode)) } label: {
                Text(i18n.t("consignments.openDevice")).frame(maxWidth: .infinity)
            }
            .buttonStyle(.pillGhost)
            if let saleId = c.saleId {
                Button { open(.sales(saleId: saleId)) } label: {
                    Text(i18n.t("consignments.resultingSale")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillGhost)
            }
            if c.isOut {
                Button { onSettle(c) } label: {
                    Text(i18n.t("consignments.settle")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                Button { onReturn(c) } label: {
                    Text(i18n.t("consignments.return")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillDestructive)
            }
        }
    }

    /// Jump to another feature (inventory / sales) and close this sheet.
    private func open(_ route: KitRoute) {
        container.router.open(route)
        dismiss()
    }

    private func load() async {
        guard item == nil else { return }
        guard container.connectivity.isOnline else {
            errorMessage = i18n.t("common.offline")
            return
        }
        loading = true
        defer { loading = false }
        do { item = try await container.consignmentRepository.get(consignmentId) }
        catch { errorMessage = (error as? AppError)?.message }
    }
}
