import SwiftUI

/// Create / edit a partner — online-only (`partner.manage`). Blocks with a
/// needs-connection notice offline. Edit adds the active toggle.
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

    var body: some View {
        NavigationStack {
            Form {
                if !container.connectivity.isOnline {
                    Label(i18n.t("common.offline", default: "You're offline. Connect to save."),
                          systemImage: "wifi.slash")
                        .foregroundStyle(Tokens.warning)
                }
                Section {
                    LabeledField(i18n.t("partners.name"), text: $shopName)
                    LabeledField(i18n.t("partners.contactPerson"), text: $contactPerson)
                    LabeledField(i18n.t("partners.phone"), text: $phone)
                    LabeledField(i18n.t("partners.telegramHandle"), text: $telegramHandle)
                }
                Section {
                    LabeledField(i18n.t("partners.creditLimit"), text: $creditLimit, mono: true, number: true)
                    LabeledField(i18n.t("common.notes"), text: $notes)
                    if isEdit { Toggle(i18n.t("partners.active"), isOn: $isActive) }
                }
                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t(isEdit ? "partners.editPartner" : "partners.newPartner"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t(isEdit ? "common.save" : "common.create")) { Task { await save() } }
                        .disabled(saving || shopName.trimmingCharacters(in: .whitespaces).isEmpty
                                  || !container.connectivity.isOnline)
                }
            }
            .onAppear(perform: prime)
        }
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

/// A labelled single-line field used across this slice's forms.
struct LabeledField: View {
    let label: String
    @Binding var text: String
    var mono = false
    var number = false

    init(_ label: String, text: Binding<String>, mono: Bool = false, number: Bool = false) {
        self.label = label
        self._text = text
        self.mono = mono
        self.number = number
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            TextField(label, text: $text)
                .font(mono ? .mono(16) : .body)
                .keyboardType(number ? .decimalPad : .default)
                .textInputAutocapitalization(number ? .never : .sentences)
        }
    }
}
