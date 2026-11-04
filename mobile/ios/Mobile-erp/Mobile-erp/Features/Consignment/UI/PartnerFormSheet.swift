import SwiftUI

/// Create / edit a partner as a Warm Card sheet — online-only (`partner.manage`),
/// blocked with a notice offline. Edit adds the active switch.
struct PartnerFormSheet: View {
    enum Mode {
        case create
        case edit(Partner)
    }

    let mode: Mode
    var onSaved: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var shopName = ""
    @State private var contactPerson = ""
    @State private var phone = ""
    @State private var telegramHandle = ""
    @State private var creditLimit = "0"
    @State private var notes = ""
    @State private var isActive = true
    @State private var saving = false
    @State private var errorMessage: String?

    private var isEdit: Bool { if case .edit = mode { return true } else { return false } }
    private var online: Bool { container.connectivity.isOnline }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(isEdit ? "partners.editPartner" : "partners.newPartner")) { dismiss() }
                if !online { FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning) }
                field("partners.name", $shopName)
                field("partners.contactPerson", $contactPerson)
                AppFormField(label: i18n.t("partners.phone")) {
                    AppTextField(placeholder: i18n.t("partners.phone"), text: $phone, keyboard: .phonePad,
                                 autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                        .sanitizePhone($phone)
                }
                field("partners.telegramHandle", $telegramHandle)
                AppFormField(label: i18n.t("partners.creditLimit")) {
                    AppTextField(placeholder: "0", text: $creditLimit, keyboard: .decimalPad,
                                 autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                        .sanitizeDecimal($creditLimit)
                }
                field("common.notes", $notes)
                if isEdit {
                    Toggle(isOn: $isActive) {
                        Text(i18n.t("partners.active")).font(.ui(.body)).foregroundStyle(Tokens.text)
                    }
                    .frame(minHeight: Tokens.Space.minTouch)
                }
                if let errorMessage { FormErrorLine(message: errorMessage) }
                Button { Task { await save() } } label: {
                    Text(i18n.t(isEdit ? "common.save" : "common.create")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving || shopName.trimmingCharacters(in: .whitespaces).isEmpty || !online)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .onAppear(perform: prime)
    }

    private func field(_ key: String, _ text: Binding<String>) -> some View {
        AppFormField(label: i18n.t(key)) { AppTextField(placeholder: i18n.t(key), text: text) }
    }

    private func prime() {
        guard case let .edit(p) = mode else { return }
        shopName = p.shopName
        contactPerson = p.contactPerson ?? ""
        phone = p.phone ?? ""
        telegramHandle = p.telegramHandle ?? ""
        creditLimit = String(Int(Double(p.creditLimit) ?? 0))
        notes = p.notes ?? ""
        isActive = p.isActive
    }

    private func opt(_ s: String) -> String? {
        let t = s.trimmingCharacters(in: .whitespaces)
        return t.isEmpty ? nil : t
    }

    private func save() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let limit = Double(creditLimit) ?? 0
        do {
            switch mode {
            case .create:
                _ = try await container.partnerRepository.create(CreatePartnerDto(
                    shopName: shopName.trimmingCharacters(in: .whitespaces),
                    contactPerson: opt(contactPerson), phone: opt(phone),
                    telegramHandle: opt(telegramHandle), creditLimit: limit, notes: opt(notes)))
            case let .edit(p):
                try await container.partnerRepository.update(p.id, UpdatePartnerDto(
                    shopName: shopName.trimmingCharacters(in: .whitespaces),
                    contactPerson: opt(contactPerson), phone: opt(phone),
                    telegramHandle: opt(telegramHandle), creditLimit: limit,
                    notes: opt(notes), isActive: isActive))
            }
            container.sync.syncNow()
            onSaved()
            dismiss()
        } catch {
            errorMessage = (error as? AppError)?.message ?? i18n.t("common.error")
        }
    }
}
