import SwiftUI

/// Move a ticket to a legal next status (ADR 0040). Cancelling asks for a note;
/// giving back while money is owed asks for a reason (the server 409s
/// `REPAIR_BALANCE_OWED` without one). Other moves take an optional note.
struct RepairStatusSheet: View {
    let repairId: String
    let to: String
    /// True when a note is required (cancel, or give-back while owed).
    let requiresNote: Bool
    let onDone: (RepairView) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var note = ""
    @State private var busy = false
    @State private var error: String?

    private var noteOk: Bool { !requiresNote || !note.trimmingCharacters(in: .whitespaces).isEmpty }
    private var canSubmit: Bool { noteOk && !busy && container.connectivity.isOnline }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: RepairStatus.label(to, i18n)) { dismiss() }
                if requiresNote {
                    Text(i18n.t("repairs.noteRequired", default: "Add a reason to continue."))
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                AppCard {
                    AppFormField(label: i18n.t("repairs.note", default: "Note")) {
                        AppTextField(placeholder: i18n.t("repairs.note", default: "Note"), text: $note)
                    }
                }
                if let error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("repairs.moveTo", ["status": RepairStatus.label(to, i18n)], default: "Change status")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(!canSubmit)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium])
    }

    private func submit() {
        guard canSubmit else { return }
        busy = true; error = nil
        Haptic.tick.play()
        let trimmed = note.trimmingCharacters(in: .whitespaces)
        let payload = ChangeStatusPayload(toStatusCode: to, note: trimmed.isEmpty ? nil : trimmed)
        Task {
            do {
                let updated = try await RepairsRepository(container).changeStatus(repairId, payload)
                busy = false
                onDone(updated)
                dismiss()
            } catch let e as AppError { busy = false; error = RepairError.message(e, i18n) }
            catch { busy = false; self.error = error.localizedDescription }
        }
    }
}
