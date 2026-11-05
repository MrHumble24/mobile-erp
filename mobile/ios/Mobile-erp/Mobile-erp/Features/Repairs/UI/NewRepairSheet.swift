import SwiftUI

/// New repair ticket (ADR 0040): customer, device name, optional model + IMEI /
/// serial, the problem, agreed price, warranty days typed per ticket, and the
/// master — our own (a user) or an outside one (name + phone + what we pay).
/// **No passcode / pattern / ID field, ever.** Online only.
struct NewRepairSheet: View {
    let onCreated: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var draft = NewRepairDraft()
    @State private var models: [PurchaseModel] = []
    @State private var masters: [RepairPerson] = []
    @State private var busy = false
    @State private var error: String?

    private var offline: Bool { !container.connectivity.isOnline }
    private var canCreate: Bool { !offline && draft.isValid && !busy }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("repairs.newTitle", default: "New ticket")) { dismiss() }
                customerCard
                deviceCard
                problemCard
                masterCard
                if offline { FormErrorLine(message: i18n.t("repairs.onlineOnly", default: "Repairs are available online only.")) }
                if let error { FormErrorLine(message: error) }
                Button(action: create) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("repairs.createTicket", default: "Create ticket")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(!canCreate)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            if models.isEmpty { models = (try? await PurchasesRepository(container).sellableModels()) ?? [] }
            if masters.isEmpty { masters = (try? await RepairsRepository(container).masters()) ?? [] }
        }
    }

    private var customerCard: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("repairs.customer", default: "Customer")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                RepairCustomerField(customer: $draft.customer)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var deviceCard: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                AppFormField(label: i18n.t("repairs.deviceName", default: "Device")) {
                    AppTextField(placeholder: i18n.t("repairs.deviceNamePlaceholder", default: "e.g. iPhone 13, cracked screen"), text: $draft.deviceName)
                }
                AppFormField(label: i18n.t("repairs.model", default: "Model (optional)")) {
                    AppSelect(placeholder: "—",
                              selection: Binding(get: { draft.modelId ?? "" }, set: { draft.modelId = $0.isEmpty ? nil : $0 }),
                              options: [("", "—")] + models.map { ($0.id, $0.label) })
                }
                AppFormField(label: i18n.t("inventory.imei1", default: "IMEI (optional)")) {
                    ScanOrValueField(text: $draft.imei, placeholder: i18n.t("shipments.scanImei", default: "Scan or type"))
                }
                AppFormField(label: i18n.t("catalog.serialNumber", default: "Serial (optional)")) {
                    ScanOrValueField(text: $draft.serialNumber, placeholder: i18n.t("catalog.scanCode", default: "Scan or type"))
                }
            }
        }
    }

    private var problemCard: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                AppFormField(label: i18n.t("repairs.problem", default: "Problem")) {
                    AppTextField(placeholder: i18n.t("repairs.problem", default: "What is broken"), text: $draft.problem)
                }
                AppFormField(label: i18n.t("repairs.agreedPrice", default: "Agreed price")) {
                    AppTextField(placeholder: "0", text: $draft.agreedPrice, keyboard: .decimalPad, font: .mono(15, weight: .medium))
                        .sanitizeDecimal($draft.agreedPrice)
                }
                AppFormField(label: i18n.t("repairs.warrantyDays", default: "Warranty (days)")) {
                    AppTextField(placeholder: "0", text: $draft.warrantyDays, keyboard: .numberPad, font: .data(.regular))
                        .sanitizeDigits($draft.warrantyDays)
                }
                AppFormField(label: i18n.t("repairs.notes", default: "Notes (optional)")) {
                    AppTextField(placeholder: i18n.t("repairs.notes", default: "Notes"), text: $draft.notes)
                }
            }
        }
    }

    private var masterCard: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("repairs.master", default: "Master")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                SegmentedControl(selection: $draft.masterMode, segments: [
                    (.own, i18n.t("repairs.ownMaster", default: "Our master")),
                    (.outside, i18n.t("repairs.outsideMaster", default: "Outside master")),
                ])
                if draft.masterMode == .own {
                    AppFormField(label: i18n.t("repairs.ownMaster", default: "Our master")) {
                        AppSelect(placeholder: "—",
                                  selection: Binding(get: { draft.ownMasterId ?? "" }, set: { draft.ownMasterId = $0.isEmpty ? nil : $0 }),
                                  options: [("", "—")] + masters.map { ($0.id, $0.name) })
                    }
                } else {
                    AppFormField(label: i18n.t("repairs.outsideMasterName", default: "Outside master name")) {
                        AppTextField(placeholder: i18n.t("repairs.outsideMasterName", default: "Name"), text: $draft.outsideName)
                    }
                    AppFormField(label: i18n.t("repairs.outsideMasterPhone", default: "Phone (optional)")) {
                        AppTextField(placeholder: i18n.t("repairs.outsideMasterPhone", default: "Phone"), text: $draft.outsidePhone, keyboard: .phonePad)
                            .sanitizePhone($draft.outsidePhone)
                    }
                    AppFormField(label: i18n.t("repairs.outsideCost", default: "We pay the master")) {
                        AppTextField(placeholder: "0", text: $draft.outsideCost, keyboard: .decimalPad, font: .mono(15, weight: .medium))
                            .sanitizeDecimal($draft.outsideCost)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func create() {
        guard canCreate, let payload = draft.payload() else { return }
        busy = true; error = nil
        Haptic.tick.play()
        Task {
            do {
                _ = try await RepairsRepository(container).create(payload)
                busy = false
                container.toasts.success(i18n.t("repairs.createdToast", default: "Ticket created"))
                onCreated()
                dismiss()
            } catch let e as AppError { busy = false; error = RepairError.message(e, i18n) }
            catch { busy = false; self.error = error.localizedDescription }
        }
    }
}
