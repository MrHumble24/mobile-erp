import SwiftUI

/// Edit a phone's own expense (`device.expense`, ADR 0026). Works on sold phones
/// too; the server posts the DEVICE_EXPENSE difference. Online-only.
struct EditUnitExpenseSheet: View {
    let device: DeviceDetail
    var onSaved: () -> Void = {}

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var amount: String
    @State private var note: String
    @State private var saving = false
    @State private var error: String?

    init(device: DeviceDetail, onSaved: @escaping () -> Void = {}) {
        self.device = device
        self.onSaved = onSaved
        _amount = State(initialValue: device.unitExpense ?? "")
        _note = State(initialValue: device.unitExpenseNote ?? "")
    }

    var body: some View {
        DeviceCostSheetScaffold(
            title: i18n.t("inventory.editUnitExpense"),
            hint: i18n.t("inventory.unitExpenseHint"),
            error: error, saving: saving,
            online: container.connectivity.isOnline,
            onSave: { Task { await save() } },
            onClose: { dismiss() }
        ) {
            AppFormField(label: i18n.t("inventory.unitExpense")) {
                AppTextField(placeholder: "0", text: $amount, keyboard: .decimalPad, font: .data(.regular))
                    .sanitizeDecimal($amount)
            }
            AppFormField(label: i18n.t("inventory.unitExpenseNote")) {
                AppTextField(placeholder: i18n.t("inventory.unitExpenseNote"), text: $note)
            }
        }
    }

    private func save() async {
        guard let value = Decimal(string: amount.trimmingCharacters(in: .whitespaces)), value >= 0 else {
            error = i18n.t("common.required"); return
        }
        saving = true; error = nil
        defer { saving = false }
        do {
            try await DeviceRepository(container).setExpense(id: device.id, unitExpense: value,
                                                             note: note.trimmingCharacters(in: .whitespaces))
            container.toasts.success(i18n.t("inventory.unitExpenseSaved"))
            onSaved(); dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}

/// Hand-fix a phone's customs fee (`customs.manage`, ADR 0027). Works on sold
/// phones too; the server posts the CUSTOMS difference. Online-only.
struct EditCustomsFeeSheet: View {
    let device: DeviceDetail
    var onSaved: () -> Void = {}

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var amount: String
    @State private var saving = false
    @State private var error: String?

    init(device: DeviceDetail, onSaved: @escaping () -> Void = {}) {
        self.device = device
        self.onSaved = onSaved
        _amount = State(initialValue: device.customsFee ?? "")
    }

    var body: some View {
        DeviceCostSheetScaffold(
            title: i18n.t("inventory.editCustomsFee"),
            hint: nil,
            error: error, saving: saving,
            online: container.connectivity.isOnline,
            onSave: { Task { await save() } },
            onClose: { dismiss() }
        ) {
            AppFormField(label: i18n.t("inventory.customsFee")) {
                AppTextField(placeholder: "0", text: $amount, keyboard: .decimalPad, font: .data(.regular))
                    .sanitizeDecimal($amount)
            }
        }
    }

    private func save() async {
        guard let value = Decimal(string: amount.trimmingCharacters(in: .whitespaces)), value >= 0 else {
            error = i18n.t("common.required"); return
        }
        saving = true; error = nil
        defer { saving = false }
        do {
            try await DeviceRepository(container).setCustomsFee(id: device.id, customsFee: value)
            container.toasts.success(i18n.t("inventory.customsFeeSaved"))
            onSaved(); dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}

/// Shared Warm Card scaffold for the two device-cost edit sheets: title + close,
/// the caller's fields, an optional hint, inline error, offline notice and the
/// one primary save pill.
private struct DeviceCostSheetScaffold<Fields: View>: View {
    let title: String
    let hint: String?
    let error: String?
    let saving: Bool
    let online: Bool
    let onSave: () -> Void
    let onClose: () -> Void
    @ViewBuilder var fields: () -> Fields
    @Environment(I18n.self) private var i18n

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    Text(title).font(.ui(.title)).foregroundStyle(Tokens.text)
                    Spacer(minLength: Tokens.Space.sm)
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Tokens.text)
                            .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                            .background(Tokens.surface2, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(i18n.t("common.cancel"))
                }
                fields()
                if let hint {
                    Text(hint).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                if let error {
                    Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
                if !online {
                    Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                        .font(.ui(.caption)).foregroundStyle(Tokens.warning)
                }
                Button(action: onSave) {
                    Text(saving ? i18n.t("common.loading") : i18n.t("common.save"))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving || !online)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }
}
