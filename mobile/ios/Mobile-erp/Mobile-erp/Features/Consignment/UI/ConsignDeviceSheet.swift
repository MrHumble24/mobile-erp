import SwiftUI

/// Hand one or more in-stock devices to a partner on consignment, as a Warm
/// Card sheet. Offline-capable: the writer queues each row to the outbox and
/// marks it pending. Partner is locked when launched from a partner's detail.
struct ConsignDeviceSheet: View {
    let partnerId: String?
    let lockPartner: Bool
    var onSuccess: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var model: ConsignFormModel?
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("consignments.newConsignment")) { dismiss() }
                if let model { form(model) } else { LoadingView().frame(height: 160) }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            if model == nil {
                let m = container.makeConsignFormModel(partnerId: partnerId, lockPartner: lockPartner)
                model = m
                await m.loadPartners()
            }
        }
    }

    @ViewBuilder private func form(_ model: ConsignFormModel) -> some View {
        @Bindable var model = model
        if lockPartner {
            SubjectBlock(title: i18n.t("consignments.partner"), line: partnerName(model, model.partnerId), mono: false)
        } else {
            AppFormField(label: i18n.t("consignments.partner")) {
                AppSelect(placeholder: i18n.t("consignments.selectPartner"), selection: $model.partnerId,
                          options: model.partners.map { ($0.id, $0.shopName) })
            }
        }

        Text(i18n.t("consignments.devices")).font(.ui(.heading)).foregroundStyle(Tokens.text)
        ForEach($model.rows) { $row in
            DeviceRowEditor(row: $row, index: model.rows.firstIndex(where: { $0.id == row.id }) ?? 0,
                            canRemove: model.rows.count > 1) { model.removeRow(row.id) }
        }
        Button { model.addRow() } label: {
            Label(i18n.t("consignments.addDevice"), systemImage: "plus").frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillSecondary)

        AppFormField(label: i18n.t("consignments.dueDate")) { AppDateField(date: $model.dueDate) }
        AppFormField(label: i18n.t("common.notes")) {
            AppTextField(placeholder: i18n.t("common.notes"), text: $model.notes)
        }
        if let errorMessage { FormErrorLine(message: errorMessage) }

        Button { Task { await submit() } } label: {
            Text(i18n.t("consignments.newConsignment")).frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillPrimary)
        .disabled(!model.canSubmit || model.isSubmitting)
    }

    private func partnerName(_ model: ConsignFormModel, _ id: String) -> String {
        model.partners.first { $0.id == id }?.shopName ?? id
    }

    private func submit() async {
        guard let model else { return }
        errorMessage = nil
        do {
            _ = try await model.submit()   // queued vs applied surfaced by the list's pending marker
            onSuccess()
            dismiss()
        } catch {
            errorMessage = creditMessage(error) ?? (error as? AppError)?.message ?? i18n.t("common.error")
        }
    }

    /// A 409 means the device left stock between load and submit — ask to retry.
    private func creditMessage(_ error: Error) -> String? {
        guard let e = error as? AppError else { return nil }
        if e.statusCode == 409 { return i18n.t("common.retry") }
        return nil
    }
}

/// One device as a surface-2 block: scan-or-type IMEI plus the agreed price.
private struct DeviceRowEditor: View {
    @Binding var row: ConsignFormModel.DeviceRow
    let index: Int
    let canRemove: Bool
    var onRemove: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            HStack {
                Text("\(i18n.t("consignments.device")) #\(index + 1)").font(.ui(.label)).foregroundStyle(Tokens.muted)
                Spacer()
                if canRemove {
                    Button(i18n.t("consignments.removeDevice"), action: onRemove).buttonStyle(.pillGhost)
                }
            }
            ScanOrValueField(text: $row.imei, placeholder: "IMEI")
            AppFormField(label: i18n.t("consignments.agreedPrice")) {
                AppTextField(placeholder: i18n.t("consignments.agreedPrice"), text: $row.agreedPrice,
                             keyboard: .decimalPad, font: .data(.regular))
                    .sanitizeDecimal($row.agreedPrice)
            }
        }
        .padding(Tokens.Space.lg)
        .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))
    }
}
