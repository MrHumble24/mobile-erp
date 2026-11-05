import SwiftUI

/// Sticky model + specs + cost with two IMEI slots. A scan fills the next empty
/// slot; once model + cost + every required slot is set the confirm sheet opens.
/// A box code or IMEI can also fill the model/colour/storage (lookup, ADR 0031).
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
    @State private var serial = ""
    @State private var error: String?
    @State private var pending: IntakePendingScan?
    /// True while the lookup is setting `modelId`, so the `modelId` change does not
    /// wipe the IMEI/specs the lookup (or the person) just filled (ADR 0031).
    @State private var applyingLookup = false

    private var model: DeviceModel? { models.first { $0.id == modelId } }

    /// Focus the identifier field on appear — except in a `-intakeBox` screenshot
    /// run, where the keyboard would hide the lookup result.
    private var autoFocusIdentifier: Bool {
        #if DEBUG
        if UserDefaults.standard.string(forKey: "intakeBox") != nil { return false }
        #endif
        return true
    }

    /// QUANTITY models are not stocked as units (ADR 0029 — the server rejects
    /// intake 400), so they never appear in the intake picker.
    private var sellableModels: [DeviceModel] { models.filter { !$0.isQuantity } }

    var body: some View {
        Picker(i18n.t("shipments.selectModel"), selection: $modelId) {
            Text("—").tag(String?.none)
            ForEach(sellableModels) { m in Text(m.label).tag(String?.some(m.id)) }
        }
        .onChange(of: modelId) {
            // A lookup-driven model change keeps what was already filled; only a
            // manual pick starts the unit over.
            if applyingLookup {
                applyingLookup = false
                stageIfComplete(showHints: false)
                return
            }
            specs = [:]; imei1 = ""; imei2 = ""; serial = ""; error = nil
            stageIfComplete(showHints: false)
        }
        #if DEBUG
        // Screenshot helper: `-intakeModel <id>` preselects a model so a capture
        // lands on its (serial or IMEI) identifier field without tapping the picker.
        .onAppear {
            if modelId == nil, let arg = KitDebugLaunch.consume("intakeModel", accept: {
                id in models.contains { $0.id == id }
            }) { modelId = arg }
        }
        #endif

        // Fill the model + specs from a scanned/typed box code or IMEI (ADR 0031).
        IntakeLookupSection(modelId: $modelId, specs: $specs, models: sellableModels,
                            imei: imei1, applyProduct: applyLookup)

        if let model {
            ForEach(model.attributes) { attr in
                IntakeSpecField(attr: attr, value: Binding(
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

        // The identifier block follows the model's kind: a SERIAL model asks for a
        // serial number (no IMEI / second IMEI); an IMEI model keeps the IMEI slots.
        Group {
            if model?.isSerial == true { serialBlock } else { imeiBlock }
        }
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
                             autoFocus: autoFocusIdentifier, onScan: fill)

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
    }

    /// The serial block for a SERIAL model: one scan-or-type field (barcode
    /// accepted) with the serial-format hint and a shared inline error line.
    private var serialBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(i18n.t("catalog.serialNumber")).font(.caption).foregroundStyle(Tokens.muted)
            ScanOrValueField(text: $serial, placeholder: i18n.t("catalog.scanCode"),
                             autoFocus: autoFocusIdentifier, onScan: fillSerial)
            Text(i18n.t("catalog.serialNumberHint")).font(.caption).foregroundStyle(Tokens.muted)
            if let error { Text(error).font(.footnote).foregroundStyle(Tokens.danger) }
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

    /// A scanned serial barcode fills the single serial slot (trimmed/upper-cased).
    private func fillSerial(_ raw: String) {
        guard pending == nil else { return }
        let code = UnitCode.normalizeSerial(raw)
        guard UnitCode.isValidSerial(code) else { error = i18n.t("catalog.errorSerialInvalid"); return }
        error = nil
        serial = code
        stageIfComplete(showHints: true)
    }

    /// Open the confirm sheet once the identifier (IMEI slots or serial) plus
    /// model + cost + required specs are set. Dispatches on the model's kind.
    private func stageIfComplete(showHints: Bool) {
        guard pending == nil else { return }
        guard let model else {
            if showHints, !(imei1.isEmpty && serial.isEmpty) { error = i18n.t("shipments.selectModel") }
            return
        }
        if model.isSerial { stageSerial(model, showHints: showHints) }
        else { stageImei(model, showHints: showHints) }
    }

    private func stageImei(_ model: DeviceModel, showHints: Bool) {
        guard !imei1.isEmpty else { return }
        if dualSim && imei2.isEmpty { return }
        guard let c = cost.asDecimal, c >= 0 else {
            if showHints { error = i18n.t("shipments.acquisitionCost") }; return
        }
        guard specsComplete(model, showHints: showHints) else { return }
        error = nil
        let second = dualSim ? imei2.trimmedOrNil : nil
        if isDuplicate(imei1) || (second.map(isDuplicate) ?? false) {
            pending = IntakePendingScan(code: imei1, draft: nil,
                                        error: i18n.t("shipments.duplicateImei")); return
        }
        let draft = IntakeDraft(
            imei: imei1, imei2: second, serialNumber: nil, modelId: model.id,
            specs: specs.filter { !$0.value.trimmed.isEmpty },
            acquisitionCost: c, targetPrice: target.asDecimal,
            unitExpense: canSetExpense ? expense.asDecimal : nil,
            unitExpenseNote: canSetExpense ? expenseNote.trimmedOrNil : nil
        )
        pending = IntakePendingScan(code: imei1, draft: draft, error: nil)
    }

    private func stageSerial(_ model: DeviceModel, showHints: Bool) {
        let s = UnitCode.normalizeSerial(serial)
        guard !s.isEmpty else { return }
        guard UnitCode.isValidSerial(s) else {
            if showHints { error = i18n.t("catalog.errorSerialInvalid") }; return
        }
        guard let c = cost.asDecimal, c >= 0 else {
            if showHints { error = i18n.t("shipments.acquisitionCost") }; return
        }
        guard specsComplete(model, showHints: showHints) else { return }
        error = nil
        if isDuplicate(s) {
            pending = IntakePendingScan(code: s, draft: nil,
                                        error: i18n.t("catalog.errorSerialExists")); return
        }
        let draft = IntakeDraft(
            imei: nil, imei2: nil, serialNumber: s, modelId: model.id,
            specs: specs.filter { !$0.value.trimmed.isEmpty },
            acquisitionCost: c, targetPrice: target.asDecimal,
            unitExpense: canSetExpense ? expense.asDecimal : nil,
            unitExpenseNote: canSetExpense ? expenseNote.trimmedOrNil : nil
        )
        pending = IntakePendingScan(code: s, draft: draft, error: nil)
    }

    private func specsComplete(_ model: DeviceModel, showHints: Bool) -> Bool {
        for attr in model.attributes where attr.required {
            if (specs[attr.key]?.trimmed ?? "").isEmpty {
                if showHints { error = i18n.t("shipments.invalidSpecs") }
                return false
            }
        }
        return true
    }

    /// Apply a looked-up product (ADR 0031): select it (auto only when no model is
    /// chosen yet; a manual pick always wins), then fill storage/colour — only the
    /// fields still empty, never overwriting what the person typed.
    private func applyLookup(_ product: LookupProduct, force: Bool) {
        if modelId != product.modelId, force || modelId == nil {
            applyingLookup = true
            modelId = product.modelId
        }
        guard modelId == product.modelId else { return }
        specs = IntakeLookupFill.apply(current: specs,
                                       storage: product.storageOption, color: product.colorOption)
        stageIfComplete(showHints: false)
    }

    private func confirm() {
        if let draft = pending?.draft {
            onAdd(draft)
            imei1 = ""; imei2 = ""; serial = ""   // per-device — next unit starts clean
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

private extension String {
    var isEmptyNil: String? { isEmpty ? nil : self }
}
