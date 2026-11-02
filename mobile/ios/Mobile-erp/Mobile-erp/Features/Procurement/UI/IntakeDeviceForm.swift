import SwiftUI

/// Sticky model + specs + cost with a `ScannerField` that stages one unit per
/// scan — model/specs/cost persist for the next unit (the intake loop). Emits a
/// validated `IntakeDraft`; the IMEI field clears and refocuses itself.
struct IntakeDeviceForm: View {
    @Environment(I18n.self) private var i18n
    let models: [DeviceModel]
    let onAdd: (IntakeDraft) -> Void

    @State private var modelId: String?
    @State private var specs: [String: String] = [:]
    @State private var cost = ""
    @State private var target = ""
    @State private var error: String?

    private var model: DeviceModel? { models.first { $0.id == modelId } }

    var body: some View {
        Picker(i18n.t("shipments.selectModel"), selection: $modelId) {
            Text("—").tag(String?.none)
            ForEach(models) { m in Text(m.label).tag(String?.some(m.id)) }
        }
        .onChange(of: modelId) { specs = [:] }

        if let model {
            ForEach(model.attributes) { attr in
                SpecField(attr: attr, value: Binding(
                    get: { specs[attr.key] ?? "" },
                    set: { specs[attr.key] = $0 }
                ))
            }
        }

        LabeledField(i18n.t("shipments.acquisitionCost"), text: $cost, keyboard: .decimalPad)
        LabeledField(i18n.t("shipments.targetPrice"), text: $target, keyboard: .decimalPad)

        VStack(alignment: .leading, spacing: 6) {
            Text(i18n.t("shipments.scanImei")).font(.caption).foregroundStyle(.secondary)
            ScannerField(placeholder: i18n.t("shipments.scanImei"), onScan: add)
            if let error { Text(error).font(.footnote).foregroundStyle(Tokens.danger) }
        }
    }

    private func add(_ imei: String) {
        if let message = validate(imei) { error = message; return }
        onAdd(IntakeDraft(
            imei: imei.trimmed,
            modelId: model!.id,
            specs: specs.filter { !$0.value.trimmed.isEmpty },
            acquisitionCost: cost.asDecimal!,
            targetPrice: target.asDecimal
        ))
        error = nil
    }

    private func validate(_ imei: String) -> String? {
        guard Imei.isValid(imei) else { return i18n.t("shipments.imeiLength") }
        guard let model else { return i18n.t("shipments.selectModel") }
        guard let c = cost.asDecimal, c >= 0 else { return i18n.t("shipments.acquisitionCost") }
        for attr in model.attributes where attr.required {
            if (specs[attr.key]?.trimmed ?? "").isEmpty { return i18n.t("shipments.invalidSpecs") }
        }
        return nil
    }
}

/// One spec input, chosen by attribute type (select → Picker, else text).
private struct SpecField: View {
    let attr: AttributeDef
    @Binding var value: String

    private var label: String { attr.required ? "\(attr.label) *" : attr.label }

    var body: some View {
        if attr.type == "select", !attr.options.isEmpty {
            Picker(label, selection: $value) {
                Text("—").tag("")
                ForEach(attr.options, id: \.self) { Text($0).tag($0) }
            }
        } else {
            LabeledField(label, text: $value, keyboard: attr.type == "number" ? .numberPad : .default)
        }
    }
}
