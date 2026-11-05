import SwiftUI

/// A deterministic faux-barcode drawn from the IMEI (mirrors the web client).
/// Fixed white plate + black bars in both appearances: cashiers scan this, so it
/// must stay high-contrast and never invert in dark mode (same as Android).
struct DeviceBarcode: View {
    let imei: String

    private var bars: [Int] {
        let chars = Array(imei.unicodeScalars)
        return (0..<44).map { i in
            (i * 7 + Int(chars[i % chars.count].value)) % 3 + 1
        }
    }

    var body: some View {
        if !imei.isEmpty {
            VStack(spacing: Tokens.Space.xs) {
                HStack(alignment: .center, spacing: 2) {
                    ForEach(Array(bars.enumerated()), id: \.offset) { _, w in
                        Rectangle().fill(Color.black)
                            .frame(width: CGFloat(w) * 1.5, height: 36)
                    }
                }
                Text(imei).font(.mono(12)).foregroundStyle(Color.black)
            }
            .frame(maxWidth: .infinity)
            .padding(Tokens.Space.md)
            .background(Color.white, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))
        }
    }
}

/// A surface-2 block of keyed rows: label muted left, value right, hairlines, no border.
struct FactBlock<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(spacing: 0) { content() }
            .padding(.horizontal, Tokens.Space.lg)
            .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))
    }
}

/// Specs block plus the cost / margin block (cost only with `device.cost.view`).
struct DeviceSpecsGrid: View {
    let device: DeviceDetail
    let canViewCost: Bool
    @Environment(I18n.self) private var i18n

    private func spec(_ key: String) -> String {
        let v = device.specs[key] ?? ""
        return v.isEmpty ? "—" : v
    }

    var body: some View {
        VStack(spacing: Tokens.Space.sm) {
            FactBlock {
                FactRow(label: i18n.t("inventory.storage")) { Text(spec("storage")).font(.ui(.body)) }
                FactRow(label: i18n.t("inventory.color")) { Text(spec("color")).font(.ui(.body)) }
                FactRow(label: i18n.t("inventory.condition")) { Text(spec("condition")).font(.ui(.body)) }
                FactRow(label: i18n.t("inventory.ram")) { Text(spec("ram")).font(.ui(.body)) }
                FactRow(label: i18n.t("inventory.targetPrice")) {
                    Text(MoneyText.format(device.targetPrice)).font(.data(.regular))
                }
                FactRow(label: i18n.t("inventory.intakeDate"), last: true) {
                    Text(KitDate.day(device.intakeDate)).font(.data(.regular))
                }
            }
            if canViewCost, let landed = device.landedCost {
                CostBlock(device: device, landedCost: landed)
            }
        }
    }
}

/// The cost breakdown for cost-visible users: customs fee + phone expense
/// (ADR 0026/0027) feed the landed cost, then the margin against the target.
private struct CostBlock: View {
    let device: DeviceDetail
    let landedCost: String
    @Environment(I18n.self) private var i18n

    var body: some View {
        let price = Decimal(string: device.targetPrice ?? "") ?? .zero
        let cost = Decimal(string: landedCost) ?? .zero
        let margin = price - cost
        let positive = margin >= .zero
        let percent: Double = cost > .zero
            ? (NSDecimalNumber(decimal: margin).doubleValue / NSDecimalNumber(decimal: cost).doubleValue) * 100
            : 0
        FactBlock {
            if let fee = device.customsFee {
                FactRow(label: i18n.t("inventory.customsFee")) {
                    Text(MoneyText.format(fee)).font(.data(.regular))
                }
            }
            if let expense = device.unitExpense {
                FactRow(label: i18n.t("inventory.unitExpense"),
                        last: device.unitExpenseNote == nil) {
                    Text(MoneyText.format(expense)).font(.data(.regular))
                }
            }
            if let note = device.unitExpenseNote, !note.isEmpty {
                FactRow(label: i18n.t("inventory.unitExpenseNote")) {
                    Text(note).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
            FactRow(label: i18n.t("inventory.landedCost")) {
                Text(MoneyText.format(landedCost)).font(.data(.regular))
            }
            FactRow(label: i18n.t("inventory.margin"), last: true) {
                Text("\(positive ? "+" : "")\(MoneyText.format(NSDecimalNumber(decimal: margin).stringValue)) (\(String(format: "%.1f", percent))%)")
                    .font(.data(.regular))
                    .foregroundStyle(positive ? Tokens.success : Tokens.danger)
            }
        }
    }
}

/// Latest QC inspection summary, or a placeholder when none exists.
struct QcSummarySection: View {
    let qc: QcSummary?
    @Environment(I18n.self) private var i18n

    var body: some View {
        if let qc {
            FactBlock {
                FactRow(label: i18n.t("qc.result"), last: qc.gradeCode == nil && qc.batteryHealth == nil) {
                    Text(qc.passed ? i18n.t("qc.passed") : i18n.t("qc.failed"))
                        .font(.ui(.bodyStrong))
                        .foregroundStyle(qc.passed ? Tokens.success : Tokens.danger)
                }
                if let grade = qc.gradeCode {
                    FactRow(label: i18n.t("qc.grade"), last: qc.batteryHealth == nil) { Text(grade).font(.ui(.body)) }
                }
                if let battery = qc.batteryHealth {
                    FactRow(label: i18n.t("qc.batteryHealth"), last: true) { Text("\(battery)%").font(.data(.regular)) }
                }
            }
        } else {
            Text(i18n.t("inventory.noQc")).font(.ui(.body)).foregroundStyle(Tokens.muted)
        }
    }
}

/// Status-history list: translated transition, reason, mono timestamp.
struct DeviceHistoryList: View {
    let history: [DeviceHistoryEntry]
    @Environment(I18n.self) private var i18n

    private func label(_ code: String) -> String { i18n.t(DeviceStatusMeta.labelKey(code)) }

    var body: some View {
        if history.isEmpty {
            Text("—").font(.ui(.body)).foregroundStyle(Tokens.muted)
        } else {
            VStack(spacing: 0) {
                ForEach(Array(history.enumerated()), id: \.element.id) { i, h in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(h.fromStatusCode.map { "\(label($0)) → \(label(h.toStatusCode))" } ?? label(h.toStatusCode))
                            .font(.ui(.bodyStrong))
                            .foregroundStyle(Tokens.text)
                        if let reason = h.reason, !reason.isEmpty {
                            Text(reason).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        }
                        Text(KitDate.dayTime(h.changedAt)).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, Tokens.Space.sm)
                    if i < history.count - 1 { Divider().overlay(Tokens.border) }
                }
            }
        }
    }
}
