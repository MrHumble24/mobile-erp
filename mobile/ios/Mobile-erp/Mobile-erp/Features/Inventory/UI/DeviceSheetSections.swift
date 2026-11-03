import SwiftUI

/// A deterministic faux-barcode drawn from the IMEI (mirrors the web client).
struct DeviceBarcode: View {
    let imei: String

    private var bars: [Int] {
        let chars = Array(imei.unicodeScalars)
        return (0..<44).map { i in
            (i * 7 + Int(chars[i % chars.count].value)) % 3 + 1
        }
    }

    var body: some View {
        VStack(spacing: 4) {
            HStack(alignment: .center, spacing: 2) {
                ForEach(Array(bars.enumerated()), id: \.offset) { _, w in
                    Rectangle().fill(Tokens.ink)
                        .frame(width: CGFloat(w) * 1.5, height: 36)
                }
            }
            Text(imei).font(.mono(11)).tracking(2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}

/// Single-column, roomy specs view plus the cost / margin row.
struct DeviceSpecsGrid: View {
    let device: DeviceDetail
    let canViewCost: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: 10) {
            VStack(spacing: 0) {
                specRow(icon: "internaldrive", label: i18n.t("inventory.storage", default: "Storage"), value: device.specs["storage"])
                Divider()
                specRow(icon: "paintpalette", label: i18n.t("inventory.color", default: "Color"), value: device.specs["color"])
                Divider()
                specRow(icon: "sparkles", label: i18n.t("inventory.condition", default: "Condition"), value: device.specs["condition"])
                Divider()
                specRow(icon: "memorychip", label: i18n.t("inventory.ram", default: "RAM"), value: device.specs["ram"])
                Divider()
                specRow(icon: "tag", label: i18n.t("inventory.targetPrice", default: "Target Price"), value: MoneyText.format(device.targetPrice))
                Divider()
                specRow(icon: "calendar", label: i18n.t("inventory.intakeDate", default: "Intake Date"), value: device.intakeDate.isEmpty ? "—" : device.intakeDate)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 4)
            .background(Tokens.surface)
            .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous)
                    .strokeBorder(Tokens.hairline, lineWidth: 1)
            )

            if canViewCost, let landed = device.landedCost {
                MarginRow(targetPrice: device.targetPrice, landedCost: landed)
            }
        }
    }

    private func specRow(icon: String, label: String, value: String?) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .frame(width: 20)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value?.isEmpty == false ? value! : "—")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Tokens.ink)
        }
        .padding(.vertical, 10)
    }
}

private struct MarginRow: View {
    let targetPrice: String?
    let landedCost: String
    @Environment(I18n.self) private var i18n

    var body: some View {
        let price = Decimal(string: targetPrice ?? "") ?? .zero
        let cost = Decimal(string: landedCost) ?? .zero
        let margin = price - cost
        let positive = margin >= .zero
        let percent: Double = cost > .zero
            ? (NSDecimalNumber(decimal: margin).doubleValue / NSDecimalNumber(decimal: cost).doubleValue) * 100
            : 0
        return HStack {
            Text("\(i18n.t("inventory.landedCost")): \(MoneyText.format(landedCost))")
                .font(.caption).foregroundStyle(.secondary)
            Spacer()
            Text("\(i18n.t("inventory.margin")): \(positive ? "+" : "")\(MoneyText.format(NSDecimalNumber(decimal: margin).stringValue)) (\(String(format: "%.1f", percent))%)")
                .font(.caption.weight(.bold))
                .foregroundStyle(positive ? Tokens.success : Tokens.danger)
        }
        .padding(10)
        .background(Color(.tertiarySystemGroupedBackground),
                    in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
    }
}

/// Latest QC inspection summary, or a placeholder when none exists.
struct QcSummarySection: View {
    let qc: QcSummary?
    @Environment(I18n.self) private var i18n

    var body: some View {
        if let qc {
            LabeledContent(i18n.t("qc.result")) {
                Text(qc.passed ? i18n.t("qc.passed") : i18n.t("qc.failed"))
                    .foregroundStyle(qc.passed ? Tokens.success : Tokens.danger)
                    .fontWeight(.semibold)
            }
            if let grade = qc.gradeCode {
                LabeledContent(i18n.t("qc.grade"), value: grade)
            }
            if let battery = qc.batteryHealth {
                LabeledContent(i18n.t("qc.batteryHealth"), value: "\(battery)%")
            }
        } else {
            Text(i18n.t("inventory.noQc")).foregroundStyle(.secondary)
        }
    }
}

/// Scrollable status-history list.
struct DeviceHistoryList: View {
    let history: [DeviceHistoryEntry]

    var body: some View {
        if history.isEmpty {
            Text("—").foregroundStyle(.secondary)
        } else {
            ForEach(history) { h in
                VStack(alignment: .leading, spacing: 2) {
                    Text(h.fromStatusCode.map { "\($0) → \(h.toStatusCode)" } ?? h.toStatusCode)
                        .font(.subheadline.weight(.semibold))
                    if let reason = h.reason, !reason.isEmpty {
                        Text("\"\(reason)\"").font(.caption).italic().foregroundStyle(.secondary)
                    }
                    Text(h.changedAt).font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
    }
}
