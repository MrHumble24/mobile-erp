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
                ScannerField(placeholder: i18n.t("pos.scanPrompt")) { code in
                    model.scan(code)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
            }

            if model.busy && model.device == nil {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text(i18n.t("common.loading", default: "Searching inventory..."))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 20)
                }
            } else if let key = model.errorKey {
                Section {
                    HStack(spacing: 12) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Tokens.danger)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(errorTitle(key))
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Tokens.danger)
                            Text(errorText(key))
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button {
                            model.cancelScan()
                        } label: {
                            Image(systemName: "xmark")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.secondary)
                                .padding(8)
                                .background(Circle().fill(Color(.tertiarySystemFill)))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.vertical, 4)
                }
            } else if let device = model.device {
                Section {
                    HeroDeviceCard(device: device) {
                        model.cancelScan()
                    }
                    .listRowInsets(EdgeInsets(top: 10, leading: 14, bottom: 10, trailing: 14))
                }
                PosCheckoutForm(device: device, model: model)
            } else {
                Section {
                    EmptyScanLanding()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                }
                .listRowBackground(Color.clear)
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .animation(.snappy(duration: 0.25), value: model.device != nil)
        .navigationTitle(i18n.t("pos.title"))
        .sheet(item: $model.completed) { sale in
            PosReceiptSheet(sale: sale) {
                model.dismissReceipt()
            }
        }
        .task {
            model.configure(container)
            #if DEBUG
            _ = PosSelfCheck.ran
            #endif
        }
    }

    private func errorTitle(_ key: String) -> String {
        switch key {
        case "pos.alreadyQueued":
            return i18n.t("pos.alreadyQueued", default: "Already Queued")
        case "pos.deviceConflict":
            return i18n.t("pos.deviceConflict", default: "Not in Stock")
        case "common.notFound":
            return i18n.t("common.notFound", default: "Device Not Found")
        default:
            return i18n.t("common.error", default: "Scan Error")
        }
    }

    private func errorText(_ key: String) -> String {
        switch key {
        case "pos.alreadyQueued":
            return i18n.t("pos.alreadyQueuedHint", default: "This unit is already waiting in the sync queue.")
        case "pos.deviceConflict":
            return i18n.t("pos.deviceConflictHint", default: "Device status is not IN_STOCK.")
        case "common.notFound":
            return i18n.t("inventory.imeiNotFound", default: "No matching device found in inventory.")
        default:
            return i18n.t(key)
        }
    }
}

/// Hero card highlighting the currently scanned unit with copy and clear actions.
private struct HeroDeviceCard: View {
    let device: ScannedDevice
    let onClear: () -> Void

    @Environment(I18n.self) private var i18n
    @State private var copied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(device.modelLabel)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(Tokens.ink)

                    HStack(spacing: 6) {
                        Text(device.imei)
                            .font(.mono(13, weight: .medium))
                            .foregroundStyle(.secondary)

                        Button {
                            UIPasteboard.general.string = device.imei
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            withAnimation(.snappy(duration: 0.2)) { copied = true }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                withAnimation { copied = false }
                            }
                        } label: {
                            Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(copied ? Tokens.success : .secondary)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Copy IMEI")
                    }
                }

                Spacer()

                Button(action: onClear) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.secondary.opacity(0.8))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Cancel scan")
            }

            HStack(spacing: 8) {
                StatusBadge(deviceStatus: device.statusCode,
                            label: i18n.t(DeviceStatusMeta.labelKey(device.statusCode)))

                if let target = device.targetPrice {
                    HStack(spacing: 4) {
                        Text(i18n.t("pos.targetPrice", default: "Target:"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        MoneyText(value: target, size: 13)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Tokens.ink)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color(.tertiarySystemFill), in: Capsule())
                }
            }
        }
        .padding(.vertical, 4)
    }
}

/// Inviting empty state when no device has been scanned yet.
private struct EmptyScanLanding: View {
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(.tertiarySystemFill))
                    .frame(width: 64, height: 64)
                Image(systemName: "barcode.viewfinder")
                    .font(.system(size: 30))
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 4) {
                Text(i18n.t("pos.cartEmpty", default: "Ready to Scan"))
                    .font(.headline)
                    .foregroundStyle(Tokens.ink)
                Text(i18n.t("pos.scanPrompt", default: "Scan a device IMEI or use the camera to start checkout."))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
    }
}
