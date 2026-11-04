import SwiftUI

/// Grade a device: fetch it by IMEI, load grades + defect types, then record an
/// inspection. Opened by a queue tap or a scan. Online-only write.
struct GradeDeviceSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let imei: String
    var onSaved: () -> Void = {}

    @State private var store: AsyncStore<GradeData>?

    var body: some View {
        NavigationStack {
            Group {
                if let store {
                    LoadableView(state: store.state, retry: { Task { await store.reload() } }) { data in
                        GradeForm(data: data, imei: imei, onSaved: onSaved)
                    }
                } else {
                    LoadingView()
                }
            }
            .navigationTitle(i18n.t("qc.runInspection"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
            }
            .task {
                if store == nil { store = makeStore() }
                await store?.reload()
            }
        }
    }

    private func makeStore() -> AsyncStore<GradeData> {
        let repo = QcRepository(api: container.api)
        let imei = imei
        return AsyncStore {
            async let d = repo.deviceByImei(imei)
            async let g = repo.listLookups("grades", includeInactive: false)
            async let f = repo.listLookups("defect-types", includeInactive: false)
            return try await GradeData(device: d, grades: g, defectTypes: f)
        }
    }
}

struct GradeData {
    let device: QcDeviceDetail
    let grades: [Lookup]
    let defectTypes: [Lookup]
}

/// The inspection form itself — separated so its `@State` resets per device.
private struct GradeForm: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let data: GradeData
    let imei: String
    let onSaved: () -> Void

    @State private var passed = true
    @State private var gradeCode: String?
    @State private var battery = "100"
    @State private var repairCost = ""
    @State private var notes = ""
    @State private var selected: Set<String> = []
    @State private var defectNotes: [String: String] = [:]
    @State private var defectError = false
    @State private var busy = false
    @State private var error: String?

    private var canCost: Bool { container.session.can("device.cost.view") }

    var body: some View {
        Form {
            Section {
                Text(data.device.imei).font(.mono(15))
                Text(data.device.modelLabel).font(.caption).foregroundStyle(Tokens.muted)
            }
            Section {
                Picker(i18n.t("qc.result"), selection: $passed) {
                    Text(i18n.t("qc.passed")).tag(true)
                    Text(i18n.t("qc.failed")).tag(false)
                }
                .pickerStyle(.segmented)

                Picker(i18n.t("qc.grade"), selection: $gradeCode) {
                    Text("—").tag(String?.none)
                    ForEach(data.grades) { g in Text(g.label).tag(String?.some(g.code)) }
                }
                LabeledField(i18n.t("qc.batteryHealth"), text: $battery, keyboard: .numberPad)
                if canCost {
                    LabeledField(i18n.t("qc.repairCostEstimate"), text: $repairCost, keyboard: .decimalPad)
                }
                LabeledField(i18n.t("common.notes"), text: $notes)
            }
            Section {
                DefectsChecklist(defectTypes: data.defectTypes, selected: $selected,
                                 notes: $defectNotes, hasError: defectError)
            }
            if let error {
                Section { Text(error).foregroundStyle(Tokens.danger).font(.footnote) }
            }
            Section {
                Button(i18n.t("common.save")) { Task { await submit() } }
                    .buttonStyle(.borderedProminent)
                    .foregroundStyle(Tokens.onInk)
                    .tint(Tokens.ink)
                    .disabled(busy)
            }
        }
        .onChange(of: selected) { defectError = false }
    }

    private func submit() async {
        if !passed && selected.isEmpty { defectError = true; return }
        if let message = offlineBlock(container, i18n) { error = message; return }
        busy = true
        defer { busy = false }
        error = nil
        let repair = canCost ? repairCost.asDecimal : nil
        let body = InspectionWriteDTO(
            deviceId: data.device.id,
            passed: passed,
            gradeCode: gradeCode,
            batteryHealth: Int(battery.trimmed),
            repairCostEstimate: (repair.map { $0 > 0 } == true) ? repair : nil,
            notes: notes.trimmedOrNil,
            defects: selected.map { DefectWriteDTO(defectCode: $0, notes: defectNotes[$0]?.trimmedOrNil) }
        )
        do {
            try await QcRepository(api: container.api).createInspection(body)
            container.toasts.success(i18n.t("common.success"))
            onSaved()
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch let other {
            error = other.localizedDescription
        }
    }
}
