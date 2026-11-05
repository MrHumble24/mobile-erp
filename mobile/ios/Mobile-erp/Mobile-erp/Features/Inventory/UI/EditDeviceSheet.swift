import SwiftUI

/// Edit a device's specs (driven by the model's attribute schema) and target
/// price. Online-only; blocked with a connection message when offline. Calls
/// `onSaved` so the detail sheet refreshes.
struct EditDeviceSheet: View {
    let device: DeviceDetail
    let store: InventoryStore
    let onSaved: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var attributes: [AttributeDef] = []
    @State private var specs: [String: String] = [:]
    @State private var targetPrice = ""
    @State private var dualSim = false
    @State private var imei2 = ""
    @State private var loading = true
    @State private var saving = false
    @State private var error: String?

    private var online: Bool { container.connectivity.isOnline }

    var body: some View {
        NavigationStack {
            Form {
                if loading {
                    LoadingView()
                } else {
                    Section {
                        DynamicSpecFields(attributes: attributes, specs: $specs)
                        TextField(i18n.t("inventory.targetPrice"), text: $targetPrice)
                            .keyboardType(.decimalPad)
                            .sanitizeDecimal($targetPrice)
                    }
                    // A serial unit has no IMEI, so no second IMEI either (ADR 0029;
                    // the server rejects imei2 on a serial unit).
                    if device.kindCode != "SERIAL" {
                        Section {
                            Toggle(i18n.t("inventory.dualSim", default: "Dual SIM"), isOn: $dualSim)
                                .toggleStyle(AppSwitchStyle())
                                .onChange(of: dualSim) { if !dualSim { imei2 = "" } }
                            if dualSim {
                                ScanOrValueField(text: $imei2,
                                                 placeholder: i18n.t("inventory.imei2", default: "IMEI 2"))
                            }
                        }
                    }
                    if let error {
                        Text(error).font(.footnote).foregroundStyle(Tokens.danger)
                    }
                    if !online {
                        Label(i18n.t("common.offline", default: "No connection to the server."),
                              systemImage: "wifi.slash")
                            .font(.footnote).foregroundStyle(Tokens.warning)
                    }
                }
            }
            .navigationTitle(i18n.t("inventory.editDevice"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save")) { Task { await save() } }
                        .disabled(saving || !online)
                }
            }
        }
        .task { await loadAttributes() }
    }

    private func loadAttributes() async {
        let attrs = (try? await DeviceModelRepository(container).attributes(device.modelId)) ?? []
        attributes = attrs
        var seeded: [String: String] = [:]
        for attr in attrs { seeded[attr.key] = device.specs[attr.key] ?? "" }
        specs = seeded
        targetPrice = device.targetPrice ?? ""
        imei2 = device.imei2 ?? ""
        dualSim = device.imei2 != nil
        loading = false
    }

    private func save() async {
        saving = true
        error = nil
        defer { saving = false }
        var payload: [String: Any] = [:]
        for attr in attributes {
            let raw = (specs[attr.key] ?? "").trimmingCharacters(in: .whitespaces)
            guard !raw.isEmpty else { continue }
            payload[attr.key] = attr.type == .number ? (Double(raw) ?? raw) : raw
        }
        let tp = targetPrice.trimmingCharacters(in: .whitespaces)
        let second = imei2.trimmingCharacters(in: .whitespaces)
        if dualSim {
            guard !second.isEmpty else {
                error = i18n.t("inventory.imei2Required",
                               default: "Second IMEI is required for dual-SIM devices"); return
            }
            guard Imei.isValid(second), second != device.imei else {
                error = i18n.t("shipments.imeiLength"); return
            }
        }
        do {
            try await DeviceRepository(container).update(
                id: device.id, specs: payload, targetPrice: tp.isEmpty ? nil : Double(tp),
                imei2: dualSim ? second : nil)
            container.sync.syncNow()
            onSaved()
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}
