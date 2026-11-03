import SwiftUI

/// Confirmation step shown after a code (QR / barcode / IMEI) is scanned, before
/// it is acted on. Two variants:
///  - `.summary` presents the resolved item — title, optional subtitle, price and
///    an optional status badge — with Cancel (ghost) and a primary Confirm pill.
///  - `.error` explains why the scan can't be used and offers only Close.
///
/// Generic by design: callers pass plain strings and a status `Color`; no feature
/// type crosses this boundary. Mount it from a `.sheet(item:)`; it sets its own
/// `.presentationDetents([.medium])`.
struct ScanConfirmSheet: View {
    enum Content {
        case summary(title: String, subtitle: String?, price: String?,
                     statusLabel: String?, statusColor: Color?)
        case error(title: String, detail: String?)
    }

    let code: String
    let content: Content
    var confirmLabel: String = ""
    var onConfirm: () -> Void = {}
    let onDismiss: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            codeBlock
            switch content {
            case let .summary(title, subtitle, price, statusLabel, statusColor):
                summaryBody(title, subtitle, price, statusLabel, statusColor)
                Spacer(minLength: 0)
                confirmActions
            case let .error(title, detail):
                errorBody(title, detail)
                Spacer(minLength: 0)
                closeAction
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Tokens.bg)
        .presentationDetents([.medium])
    }

    private var codeBlock: some View {
        HStack(spacing: 10) {
            Image(systemName: "barcode.viewfinder")
                .font(.title3)
                .foregroundStyle(Tokens.slate)
            Text(code)
                .font(.mono(17, weight: .medium))
                .foregroundStyle(Tokens.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity)
        .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
    }

    private func summaryBody(_ title: String, _ subtitle: String?, _ price: String?,
                             _ statusLabel: String?, _ statusColor: Color?) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.title3.weight(.semibold))
                .foregroundStyle(Tokens.ink)
            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Tokens.slate)
            }
            HStack {
                if let price, !price.isEmpty {
                    MoneyText(value: price, size: 20)
                }
                Spacer()
                if let statusLabel, let statusColor {
                    StatusBadge(statusLabel, color: statusColor)
                }
            }
        }
    }

    private func errorBody(_ title: String, _ detail: String?) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "exclamationmark.circle.fill")
                .font(.title2)
                .foregroundStyle(Tokens.danger)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Tokens.danger)
                if let detail, !detail.isEmpty {
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(Tokens.slate)
                }
            }
            Spacer()
        }
    }

    private var confirmActions: some View {
        HStack(spacing: 12) {
            Button(i18n.t("common.cancel", default: "Cancel"), action: onDismiss)
                .buttonStyle(.bordered)
                .tint(Tokens.ink)
            Button(confirmLabel.isEmpty ? i18n.t("common.confirm", default: "Confirm") : confirmLabel,
                   action: onConfirm)
                .buttonStyle(.borderedProminent)
                .foregroundStyle(Tokens.onInk)
                .tint(Tokens.ink)
        }
        .controlSize(.large)
        .buttonBorderShape(.capsule)
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    private var closeAction: some View {
        Button(i18n.t("common.close", default: "Close"), action: onDismiss)
            .buttonStyle(.borderedProminent)
            .foregroundStyle(Tokens.onInk)
            .tint(Tokens.ink)
            .controlSize(.large)
            .buttonBorderShape(.capsule)
            .frame(maxWidth: .infinity, alignment: .trailing)
    }
}
