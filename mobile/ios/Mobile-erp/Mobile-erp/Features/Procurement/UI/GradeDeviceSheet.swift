import SwiftUI

/// Grade a device as a Warm Card sheet: fetch it by IMEI, load grades + defect
/// types, then record an inspection. Opened by a queue tap or a scan.
/// Online-only write.
struct GradeDeviceSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let imei: String
    var onSaved: () -> Void = {}

    @State private var store: AsyncStore<GradeData>?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    Text(i18n.t("qc.runInspection")).font(.ui(.title)).foregroundStyle(Tokens.text)
                    Spacer(minLength: Tokens.Space.sm)
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Tokens.text)
                            .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                            .background(Tokens.surface2, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(i18n.t("common.cancel"))
                }
                if let store {
                    LoadableView(state: store.state, retry: { Task { await store.reload() } }) { data in
                        GradeForm(data: data, imei: imei, onSaved: onSaved)
                    }
                } else {
                    LoadingView().frame(height: 160)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            if store == nil { store = makeStore() }
            await store?.reload()
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
        VStack(alignment: .leading, spacing: Tokens.Space.lg) {
            // The unit under inspection: a surface-2 block, never a card nested in the sheet.
            VStack(alignment: .leading, spacing: 2) {
                Text(data.device.modelLabel).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                Text(data.device.imei).font(.data(.regular)).foregroundStyle(Tokens.text)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Tokens.Space.lg)
            .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))

            SegmentedControl(selection: $passed, segments: [(true, i18n.t("qc.passed")), (false, i18n.t("qc.failed"))])

            AppFormField(label: i18n.t("qc.grade")) {
                AppSelect(placeholder: i18n.t("qc.selectGrade"), selection: $gradeCode,
                          options: data.grades.map { (String?.some($0.code), $0.label) })
            }
            AppFormField(label: i18n.t("qc.batteryHealth")) {
                AppTextField(placeholder: i18n.t("qc.batteryHealth"), text: $battery, keyboard: .numberPad, font: .data(.regular))
                    .sanitizeDigits($battery)
            }
            if canCost {
                AppFormField(label: i18n.t("qc.repairCostEstimate")) {
                    AppTextField(placeholder: i18n.t("qc.repairCostEstimate"), text: $repairCost, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($repairCost)
                }
            }
            AppFormField(label: i18n.t("common.notes")) {
                AppTextField(placeholder: i18n.t("common.notes"), text: $notes)
            }
            DefectsChecklist(defectTypes: data.defectTypes, selected: $selected,
                             notes: $defectNotes, hasError: defectError)
            if let error {
                Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger)
            }
            Button {
                Task { await submit() }
            } label: {
                Text(busy ? i18n.t("common.loading") : i18n.t("common.save")).frame(maxWidth: .infinity)
            }
            .buttonStyle(.pillPrimary)
            .disabled(busy)
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
