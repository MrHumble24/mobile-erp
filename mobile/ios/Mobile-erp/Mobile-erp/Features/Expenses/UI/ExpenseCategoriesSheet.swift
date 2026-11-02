import SwiftUI

/// Manage expense categories: list existing + add a new one (online-only). The
/// add field is shown only to users with `expense.category.manage`.
struct ExpenseCategoriesSheet: View {
    let model: ExpensesModel
    var onResult: (String) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var newName = ""
    @State private var saving = false

    private var canManage: Bool { container.session.can("expense.category.manage") }

    var body: some View {
        NavigationStack {
            Form {
                Section(i18n.t("expenses.categories")) {
                    if model.categories.isEmpty {
                        Text(i18n.t("common.notFound")).foregroundStyle(.secondary)
                    }
                    ForEach(model.categories) { c in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(c.name)
                            if let d = c.description, !d.isEmpty {
                                Text(d).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                if canManage {
                    Section(i18n.t("expenses.newCategory")) {
                        HStack {
                            TextField(i18n.t("common.name"), text: $newName)
                            Button(i18n.t("common.add"), action: add)
                                .buttonStyle(.borderedProminent)
                                .tint(Tokens.ink)
                                .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty || saving)
                        }
                    }
                }
            }
            .navigationTitle(i18n.t("expenses.categories"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func add() {
        let name = newName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        guard container.connectivity.isOnline else {
            onResult(i18n.t("common.offline", default: "No connection — reconnect to save."))
            return
        }
        saving = true
        Task {
            do {
                try await model.addCategory(name: name)
                newName = ""; saving = false
                onResult(i18n.t("expenses.categorySaved"))
            } catch let e as AppError {
                saving = false; onResult(e.message)
            } catch {
                saving = false; onResult(error.localizedDescription)
            }
        }
    }
}
