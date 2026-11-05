import SwiftUI

/// Create or edit a customer as a Warm Card sheet (`POST` / `PATCH
/// /customers/:id`, online-only; blocked offline). Pass `editing` to edit.
struct CustomerFormSheet: View {
    let model: CustomersModel
    var editing: CustomerListItem?

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var phone: String
    @State private var notes: String
    @State private var level: String
    @State private var standing: String
    @State private var creditLimit: String
    @State private var defaultLimit: String?
    @State private var busy = false
    @State private var error: String?

    init(model: CustomersModel, editing: CustomerListItem? = nil) {
        self.model = model
        self.editing = editing
        _name = State(initialValue: editing?.name ?? "")
        _phone = State(initialValue: editing?.phone ?? "")
        _notes = State(initialValue: editing?.notes ?? "")
        _level = State(initialValue: editing?.level ?? PriceLevels.defaultCode)
        let pct = editing?.standing ?? 0
        _standing = State(initialValue: pct > 0 ? NSDecimalNumber(decimal: pct).stringValue : "")
        _creditLimit = State(initialValue: editing?.creditLimit ?? "")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(editing == nil ? "customers.newTitle" : "customers.editTitle")) { dismiss() }
                if !model.isOnline { FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning) }
                AppFormField(label: i18n.t("customers.name")) {
                    AppTextField(placeholder: i18n.t("customers.name"), text: $name, autocapitalization: .words)
                }
                AppFormField(label: i18n.t("customers.phone")) {
                    AppTextField(placeholder: i18n.t("customers.phone"), text: $phone, keyboard: .phonePad,
                                 autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                        .sanitizePhone($phone)
                }
                AppFormField(label: i18n.t("pricing.customerType")) {
                    AppSelect(placeholder: i18n.t("pricing.customerType"), selection: $level,
                              options: PriceLevels.all.map { ($0, i18n.t(PriceLevels.labelKey($0))) })
                }
                AppFormField(label: i18n.t("pricing.standingDiscount")) {
                    AppTextField(placeholder: "0", text: $standing,
                                 keyboard: .decimalPad, font: .mono(15, weight: .medium))
                        .sanitizeDecimal($standing)
                    Text(i18n.t("pricing.standingDiscountHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                AppFormField(label: i18n.t("credit.creditLimit")) {
                    AppTextField(placeholder: defaultLimit ?? i18n.t("credit.noLimit"), text: $creditLimit,
                                 keyboard: .decimalPad, font: .mono(15, weight: .medium))
                        .sanitizeDecimal($creditLimit)
                    Text(i18n.t("credit.creditLimitHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                AppFormField(label: i18n.t("customers.notes")) {
                    AppTextField(placeholder: i18n.t("customers.notesPlaceholder"), text: $notes)
                }
                if let error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("common.save")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(busy || CustomersInput.orNil(name) == nil || !model.isOnline)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
        .task { if defaultLimit == nil { defaultLimit = await loadDefaultLimit() } }
    }

    /// The shop's default credit limit, shown as the field's placeholder (reuses
    /// the settings read, which tolerates the number/string/null encodings).
    private func loadDefaultLimit() async -> String? {
        let settings: StoreSettings? = try? await container.api.get("/settings")
        return settings?.defaultCreditLimit
    }

    private func submit() {
        guard CustomersInput.orNil(name) != nil, !busy else { return }
        guard model.isOnline else { error = i18n.t("common.offline"); return }
        busy = true
        error = nil
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let phoneValue = CustomersInput.orNil(phone)
        let notesValue = CustomersInput.orNil(notes)
        let standingValue = NSDecimalNumber(decimal: Decimal(string: standing.trimmingCharacters(in: .whitespaces)) ?? 0).doubleValue
        let levelValue = level
        let limitText = creditLimit.trimmingCharacters(in: .whitespaces)
        let limitValue: Double? = limitText.isEmpty ? nil : Double(limitText)
        Task {
            let message: String?
            if let editing {
                message = await model.update(id: editing.id, name: trimmedName, phone: phoneValue, notes: notesValue,
                                             priceLevelCode: levelValue, standingDiscountPercent: standingValue,
                                             creditLimit: limitValue)
            } else {
                message = await model.create(name: trimmedName, phone: phoneValue, notes: notesValue,
                                             priceLevelCode: levelValue, standingDiscountPercent: standingValue,
                                             creditLimit: limitValue)
            }
            busy = false
            if let message {
                error = message == "offline" ? i18n.t("common.offline") : message
            } else {
                dismiss()
            }
        }
    }
}
