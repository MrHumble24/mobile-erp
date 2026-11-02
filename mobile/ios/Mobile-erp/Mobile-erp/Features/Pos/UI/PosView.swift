import SwiftUI

/// POS terminal: scan an IMEI → review the device → checkout. Works offline
/// (device lookup from the cache, sale queued to the outbox). A completed sale
/// opens the receipt sheet and resets for the next scan.
struct PosView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = PosViewModel()

    var body: some View {
        @Bindable var model = model
        Form {
            Section {
                ScannerField(placeholder: i18n.t("pos.scanPrompt")) { model.scan($0) }
                    .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
            }

            if model.busy && model.device == nil {
                Section { LoadingView().frame(height: 100) }
            } else if let key = model.errorKey {
                Section {
                    Label(errorText(key), systemImage: "exclamationmark.triangle")
                        .foregroundStyle(Tokens.warning)
                }
            } else if let device = model.device {
                Section(i18n.t("pos.deviceCard")) {
                    LabeledContent(device.modelLabel) {
                        StatusBadge(deviceStatus: device.statusCode, label: device.statusCode)
                    }
                    Text(device.imei).font(.mono(13)).foregroundStyle(.secondary)
                    if let target = device.targetPrice {
                        LabeledContent(i18n.t("pos.targetPrice")) {
                            MoneyText(value: target)
                        }
                    }
                }
                PosCheckoutForm(device: device, model: model)
            } else {
                Section {
                    EmptyStateView(systemImage: "qrcode.viewfinder",
                                   title: i18n.t("pos.cartEmpty"))
                        .frame(maxWidth: .infinity)
                }
                .listRowBackground(Color.clear)
            }
        }
        .navigationTitle(i18n.t("pos.title"))
        .sheet(item: $model.completed) { sale in
            PosReceiptSheet(sale: sale)
        }
        .task {
            model.configure(container)
            #if DEBUG
            _ = PosSelfCheck.ran
            #endif
        }
    }

    private func errorText(_ key: String) -> String {
        switch key {
        case "pos.alreadyQueued":
            return i18n.t(key, default: "Already queued for sync")
        default:
            return i18n.t(key)
        }
    }
}
