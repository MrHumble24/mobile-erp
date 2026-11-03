import SwiftUI

/// Hand one or more in-stock devices to a partner on consignment. Offline-
/// capable: the writer queues each row to the outbox and marks it pending.
/// Partner is locked when launched from a partner's detail.
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
        NavigationStack {
            Group {
                if let model { form(model) } else { LoadingView() }
            }
            .navigationTitle(i18n.t("consignments.newConsignment"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("consignments.newConsignment")) { Task { await submit() } }
                        .disabled(!(model?.canSubmit ?? false) || (model?.isSubmitting ?? false))
                }
            }
            .task {
                if model == nil {
                    let m = container.makeConsignFormModel(partnerId: partnerId, lockPartner: lockPartner)
                    model = m
                    await m.loadPartners()
                }
            }
        }
    }

    @ViewBuilder private func form(_ model: ConsignFormModel) -> some View {
        @Bindable var model = model
        Form {
            Section(i18n.t("consignments.partner")) {
                if lockPartner {
                    Text(partnerName(model, model.partnerId)).foregroundStyle(.secondary)
                } else {
                    Picker(i18n.t("consignments.selectPartner"), selection: $model.partnerId) {
                        Text(i18n.t("consignments.selectPartner")).tag("")
                        ForEach(model.partners) { Text($0.shopName).tag($0.id) }
                    }
                }
            }
            ForEach($model.rows) { $row in
                DeviceRowEditor(row: $row, index: model.rows.firstIndex(where: { $0.id == row.id }) ?? 0,
                                canRemove: model.rows.count > 1) { model.removeRow(row.id) }
            }
            Button { model.addRow() } label: {
                Label(i18n.t("consignments.addDevice"), systemImage: "plus")
            }
            Section {
                DatePicker(i18n.t("consignments.dueDate"), selection: $model.dueDate, displayedComponents: .date)
                CaptionedField(i18n.t("common.notes"), text: $model.notes)
            }
            if let errorMessage {
                Text(errorMessage).font(.footnote).foregroundStyle(Tokens.danger)
            }
        }
    }

    private func partnerName(_ model: ConsignFormModel, _ id: String) -> String {
        model.partners.first { $0.id == id }?.shopName ?? id
    }

    private func submit() async {
        guard let model else { return }
        errorMessage = nil
        do {
            let result = try await model.submit()
            onSuccess()
            dismiss()
            _ = result   // queued vs applied surfaced by the list's pending marker
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

/// One scannable device row: IMEI via the kit `ScannerField`, plus agreed price.
private struct DeviceRowEditor: View {
    @Binding var row: ConsignFormModel.DeviceRow
    let index: Int
    let canRemove: Bool
    var onRemove: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        Section("\(i18n.t("consignments.device")) #\(index + 1)") {
            ScanOrValueField(text: $row.imei, placeholder: "IMEI")
            CaptionedField(i18n.t("consignments.agreedPrice"), text: $row.agreedPrice, mono: true, number: true)
            if canRemove {
                Button(role: .destructive) { onRemove() } label: {
                    Label(i18n.t("consignments.removeDevice"), systemImage: "trash")
                }
            }
        }
    }
}
