import SwiftUI

/// Sticky model + specs + cost with two IMEI slots. A scan (camera, HID wedge or
/// typed) FILLS the next empty slot — IMEI 1, then IMEI 2 when Dual SIM is on —
/// and only validates "15 digits". Once every required slot plus model + cost is
/// set, the confirm sheet opens automatically; Confirm emits an `IntakeDraft` and
/// clears the IMEI slots (model/specs/cost persist for the next unit).
struct IntakeDeviceForm: View {
    @Environment(I18n.self) private var i18n
    let models: [DeviceModel]
    let onAdd: (IntakeDraft) -> Void
    /// True when an IMEI is already staged in the batch — gates the draft at
    /// confirm time (the error variant of the sheet).
    var isDuplicate: (String) -> Bool = { _ in false }
    /// Shows the per-phone expense fields only for users with `device.expense`;
    /// a non-zero expense without it is a 403 at submit.
    var canSetExpense = false

    @State private var modelId: String?
    @State private var specs: [String: String] = [:]
    @State private var cost = ""
    @State private var target = ""
    @State private var expense = ""
    @State private var expenseNote = ""
    @State private var dualSim = false
    @State private var imei1 = ""
    @State private var imei2 = ""
    @State private var error: String?
    @State private var pending: IntakePendingScan?

    private var model: DeviceModel? { models.first { $0.id == modelId } }

    var body: some View {
        Picker(i18n.t("shipments.selectModel"), selection: $modelId) {
            Text("—").tag(String?.none)
            ForEach(models) { m in Text(m.label).tag(String?.some(m.id)) }
        }
        .onChange(of: modelId) { specs = [:]; stageIfComplete(showHints: false) }

        if let model {
            ForEach(model.attributes) { attr in
                SpecField(attr: attr, value: Binding(
                    get: { specs[attr.key] ?? "" },
                    set: { specs[attr.key] = $0 }
                ))
            }
        }

        LabeledField(i18n.t("shipments.acquisitionCost"), text: $cost, keyboard: .decimalPad)
            .onChange(of: cost) { stageIfComplete(showHints: false) }
        LabeledField(i18n.t("shipments.targetPrice"), text: $target, keyboard: .decimalPad)

        if canSetExpense {
            LabeledField(i18n.t("inventory.unitExpense"), text: $expense, keyboard: .decimalPad)
            LabeledField(i18n.t("inventory.unitExpenseNote"), text: $expenseNote)
        }

        imeiBlock
    }

    /// The combined IMEI block: IMEI 1 with the Dual SIM toggle on its label row,
    /// IMEI 2 underneath when dual, and one shared inline error line.
    private var imeiBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(i18n.t("inventory.imei1", default: "IMEI 1"))
                    .font(.caption).foregroundStyle(Tokens.muted)
                Spacer()
                Toggle(i18n.t("inventory.dualSim", default: "Dual SIM"), isOn: $dualSim)
                    .toggleStyle(AppSwitchStyle())
                    .fixedSize()
            }
            ScanOrValueField(text: $imei1, placeholder: i18n.t("shipments.scanImei"),
                             autoFocus: true, onScan: fill)

            if dualSim {
                Text(i18n.t("inventory.imei2", default: "IMEI 2"))
                    .font(.caption).foregroundStyle(Tokens.muted)
                ScanOrValueField(text: $imei2,
                                 placeholder: i18n.t("inventory.imei2", default: "IMEI 2"),
                                 onScan: fill)
            }
            if let error { Text(error).font(.footnote).foregroundStyle(Tokens.danger) }
        }
        .onChange(of: dualSim) { if !dualSim { imei2 = "" }; error = nil }
        .sheet(item: $pending) { scan in
            ScanConfirmSheet(
                code: scan.code,
                content: scanContent(scan),
                confirmLabel: i18n.t("shipments.addDevice", default: "Add Device"),
                onConfirm: confirm,
                onDismiss: { pending = nil }   // Cancel keeps the filled slots
            )
        }
    }

    /// Route a scanned code into the next empty IMEI slot. Only checks length;
    /// never errors about a slot that is simply not filled yet. After a fill,
    /// `stageIfComplete` decides whether the unit is ready to confirm.
    private func fill(_ raw: String) {
        guard pending == nil else { return }   // ignore scans while the sheet is up
        let code = raw.trimmed
        guard Imei.isValid(code) else { error = i18n.t("shipments.imeiLength"); return }
        error = nil
        if imei1.isEmpty {
            imei1 = code
        } else if dualSim && imei2.isEmpty {
            guard code != imei1 else { error = i18n.t("shipments.duplicateImei"); return }
            imei2 = code
        } else {
            return   // both slots filled — nothing to fill
        }
        stageIfComplete(showHints: true)
    }

    /// Open the confirm sheet once every required slot (IMEI 1, plus IMEI 2 when
    /// dual) and model + cost are set. Missing IMEI slots wait silently; a missing
    /// model/cost/spec shows a hint only when `showHints` (a fill, not a typed
    /// field change). A batch duplicate opens the sheet's error variant.
    private func stageIfComplete(showHints: Bool) {
        guard pending == nil, !imei1.isEmpty else { return }
        if dualSim && imei2.isEmpty { return }
        guard let model else { if showHints { error = i18n.t("shipments.selectModel") }; return }
        guard let c = cost.asDecimal, c >= 0 else {
            if showHints { error = i18n.t("shipments.acquisitionCost") }; return
        }
        for attr in model.attributes where attr.required {
            if (specs[attr.key]?.trimmed ?? "").isEmpty {
                if showHints { error = i18n.t("shipments.invalidSpecs") }; return
            }
        }
        error = nil
        let second = dualSim ? imei2.trimmedOrNil : nil
        if isDuplicate(imei1) || (second.map(isDuplicate) ?? false) {
            pending = IntakePendingScan(code: imei1, draft: nil,
                                        error: i18n.t("shipments.duplicateImei")); return
        }
        let draft = IntakeDraft(
            imei: imei1, imei2: second, modelId: model.id,
            specs: specs.filter { !$0.value.trimmed.isEmpty },
            acquisitionCost: c, targetPrice: target.asDecimal,
            unitExpense: canSetExpense ? expense.asDecimal : nil,
            unitExpenseNote: canSetExpense ? expenseNote.trimmedOrNil : nil
        )
        pending = IntakePendingScan(code: imei1, draft: draft, error: nil)
    }

    private func confirm() {
        if let draft = pending?.draft {
            onAdd(draft)
            imei1 = ""; imei2 = ""   // per-device — next unit starts clean
            expense = ""; expenseNote = ""   // phone-specific, never carried over
            error = nil
        }
        pending = nil
    }

    private func scanContent(_ scan: IntakePendingScan) -> ScanConfirmSheet.Content {
        if let draft = scan.draft {
            let subtitle = [draft.imei2.map { "IMEI 2: \($0)" }, draft.specsSummary.isEmptyNil]
                .compactMap { $0 }.joined(separator: " · ")
            return .summary(
                title: model?.label ?? draft.modelId,
                subtitle: subtitle.isEmpty ? nil : subtitle,
                price: (target.asDecimal != nil ? target : cost),
                statusLabel: nil, statusColor: nil
            )
        }
        return .error(title: scan.error ?? i18n.t("common.error"), detail: nil)
    }
}

/// A unit staged for confirmation before it joins the intake batch. `draft` is
/// set when it is ready; otherwise `error` explains why (duplicate in batch).
private struct IntakePendingScan: Identifiable {
    let id = UUID()
    let code: String
    let draft: IntakeDraft?
    let error: String?
}

/// One spec input, chosen by attribute type (select → Picker, else text).
private struct SpecField: View {
    let attr: ProcAttributeDef
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

private extension String {
    var isEmptyNil: String? { isEmpty ? nil : self }
}
