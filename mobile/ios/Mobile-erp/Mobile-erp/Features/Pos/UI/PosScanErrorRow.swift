import SwiftUI

/// Scan error shown above the cart: a title, a hint and a dismiss button.
struct PosScanErrorRow: View {
    let key: String
    let onDismiss: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.circle.fill")
                .font(.title3)
                .foregroundStyle(Tokens.danger)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Tokens.danger)
                Text(hint)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button(action: onDismiss) {
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

    private var title: String {
        switch key {
        case "pos.alreadyQueued": i18n.t("pos.alreadyQueued", default: "Already Queued")
        case "pos.duplicateDevice": i18n.t("pos.duplicateDevice", default: "Already in Cart")
        case "pos.deviceConflict": i18n.t("pos.deviceConflict", default: "Not in Stock")
        case "common.notFound": i18n.t("common.notFound", default: "Device Not Found")
        default: i18n.t("common.error", default: "Scan Error")
        }
    }

    private var hint: String {
        switch key {
        case "pos.alreadyQueued":
            i18n.t("pos.alreadyQueuedHint", default: "This unit is already waiting in the sync queue.")
        case "pos.duplicateDevice":
            i18n.t("pos.duplicateDevice", default: "Device is already in the cart")
        case "pos.deviceConflict":
            i18n.t("pos.deviceConflictHint", default: "Device status is not IN_STOCK.")
        case "common.notFound":
            i18n.t("inventory.imeiNotFound", default: "No matching device found in inventory.")
        default:
            i18n.t(key)
        }
    }
}
