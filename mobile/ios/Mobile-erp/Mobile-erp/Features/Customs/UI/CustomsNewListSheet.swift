import SwiftUI

/// Create a new customs price-list version (`customs.manage`). Pre-filled from
/// the current list; rows are code / description / fee with add and remove.
/// Duplicate codes and an empty list are rejected before sending. Online-only.
struct CustomsNewListSheet: View {
    let current: CustomsCurrentList?

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var effectiveAt = Date()
    @State private var note = ""
    @State private var rows: [CustomsDraftRow] = []
    @State private var saving = false
    @State private var error: String?

    private var online: Bool { container.connectivity.isOnline }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                header
                Text(i18n.t("customs.newListHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                DatePicker(i18n.t("customs.effectiveAt"), selection: $effectiveAt, displayedComponents: .date)
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                AppFormField(label: i18n.t("customs.note")) {
                    AppTextField(placeholder: i18n.t("customs.note"), text: $note)
                }
                rowEditor
                Button { rows.append(CustomsDraftRow()) } label: {
                    Label(i18n.t("customs.addRow"), systemImage: "plus").frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillSecondary)
                if let error {
                    Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
                if !online {
                    Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                        .font(.ui(.caption)).foregroundStyle(Tokens.warning)
                }
                Button { Task { await save() } } label: {
                    Text(saving ? i18n.t("common.loading") : i18n.t("customs.saveList")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving || !online)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .onAppear(perform: prefill)
    }

    private var header: some View {
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            Text(i18n.t("customs.newList")).font(.ui(.title)).foregroundStyle(Tokens.text)
            Spacer(minLength: Tokens.Space.sm)
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Tokens.text)
                    .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                    .background(Tokens.surface2, in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(i18n.t("common.cancel"))
        }
    }

    private var rowEditor: some View {
        VStack(spacing: Tokens.Space.md) {
            ForEach($rows) { $row in
                CustomsRowEditor(row: $row, onRemove: { rows.removeAll { $0.id == row.id } })
            }
        }
    }

    private func prefill() {
        guard rows.isEmpty, let items = current?.items else { return }
        rows = items.map { CustomsDraftRow(code: $0.customsCode, description: $0.description ?? "", fee: $0.fee) }
        if rows.isEmpty { rows = [CustomsDraftRow()] }
    }

    private func save() async {
        let items = rows.compactMap { $0.input }
        guard !items.isEmpty else { error = i18n.t("customs.errorNoRows"); return }
        let codes = items.map { $0.customsCode }
        guard Set(codes).count == codes.count else { error = i18n.t("customs.errorDuplicateCode"); return }
        saving = true; error = nil
        defer { saving = false }
        let body = CreateCustomsListDTO(
            effectiveAt: ISO8601DateFormatter().string(from: effectiveAt),
            note: note.trimmingCharacters(in: .whitespaces).isEmpty ? nil : note,
            items: items
        )
        do {
            _ = try await CustomsRepository(api: container.api).create(body)
            container.toasts.success(i18n.t("customs.listSaved"))
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}

/// One editable price-list row before it is sent.
struct CustomsDraftRow: Identifiable {
    let id = UUID()
    var code = ""
    var description = ""
    var fee = ""

    /// The clean input, or nil when the code is blank or the fee unparseable —
    /// such rows are dropped before send.
    var input: CustomsItemInput? {
        let c = code.trimmingCharacters(in: .whitespaces)
        guard !c.isEmpty, let f = Decimal(string: fee.trimmingCharacters(in: .whitespaces)) else { return nil }
        let d = description.trimmingCharacters(in: .whitespaces)
        return CustomsItemInput(customsCode: c, description: d.isEmpty ? nil : d, fee: f)
    }
}

/// Inline editor for one draft row: code, description, fee and a remove button.
private struct CustomsRowEditor: View {
    @Binding var row: CustomsDraftRow
    let onRemove: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(spacing: Tokens.Space.sm) {
                HStack(spacing: Tokens.Space.sm) {
                    AppTextField(placeholder: i18n.t("customs.customsCode"), text: $row.code,
                                 autocapitalization: .characters)
                    Button(role: .destructive, action: onRemove) {
                        Image(systemName: "trash").foregroundStyle(Tokens.danger)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(i18n.t("customs.removeRow"))
                }
                AppTextField(placeholder: i18n.t("customs.description"), text: $row.description)
                AppTextField(placeholder: i18n.t("customs.fee"), text: $row.fee,
                             keyboard: .decimalPad, font: .data(.regular))
                    .sanitizeDecimal($row.fee)
            }
        }
    }
}
