import SwiftUI

/// One product's stock movements, newest first, paged. Shows the current level
/// and — with `stock.adjust` — the write-off and count-correction actions. Cost
/// (`unitCostSnapshot`) shows only with the cost permission.
struct StockMovementsSheet: View {
    let level: StockLevel
    let canAdjust: Bool
    let canViewCost: Bool
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var pager: KitPaginator<StockMovement>?
    @State private var currentQuantity: Int
    @State private var adjust: StockAdjustMode?

    init(level: StockLevel, canAdjust: Bool, canViewCost: Bool) {
        self.level = level
        self.canAdjust = canAdjust
        self.canViewCost = canViewCost
        _currentQuantity = State(initialValue: level.quantity)
    }

    var body: some View {
        NavigationStack {
            List {
                Section { header }
                if canAdjust {
                    Section { adjustActions }
                }
                Section(i18n.t("catalog.movements")) { movements }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .listRowBackground(Tokens.surface)
            .background(Tokens.bg)
            .navigationTitle(level.label)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close", default: "Close")) { dismiss() }
                }
            }
            .task {
                if pager == nil { pager = makePager() }
                await pager?.first()
                #if DEBUG
                if let raw = KitDebugLaunch.consume("openStockAdjust"),
                   let mode = StockAdjustMode(rawValue: raw) { adjust = mode }
                #endif
            }
            .appSheet(item: $adjust) { mode in
                StockAdjustSheet(mode: mode, modelId: level.modelId, currentQuantity: currentQuantity) { level in
                    currentQuantity = level.quantity
                    reload()
                }
            }
        }
    }

    private var header: some View {
        HStack {
            Text(i18n.t("catalog.onHand")).foregroundStyle(Tokens.muted)
            Spacer()
            Text("\(currentQuantity)")
                .font(.data(.large))
                .foregroundStyle(currentQuantity < 0 ? Tokens.danger : Tokens.text)
        }
        .font(.subheadline)
    }

    @ViewBuilder private var adjustActions: some View {
        Button { adjust = .writeOff } label: {
            Label(i18n.t("catalog.writeOff"), systemImage: "minus.circle")
        }
        Button { adjust = .count } label: {
            Label(i18n.t("catalog.countCorrection"), systemImage: "checklist")
        }
    }

    @ViewBuilder private var movements: some View {
        if let pager {
            if let error = pager.error, pager.items.isEmpty {
                ErrorStateView(message: error, retry: reload)
            } else if pager.items.isEmpty, !pager.isLoading {
                Text(i18n.t("catalog.movementsEmpty")).foregroundStyle(Tokens.muted)
            } else {
                ForEach(pager.items) { m in MovementRow(movement: m, canViewCost: canViewCost) }
                KitLoadMoreFooter(pager: pager)
            }
        } else {
            LoadingView()
        }
    }

    private func makePager() -> KitPaginator<StockMovement> {
        let repo = StockRepository(api: container.api)
        let id = level.modelId
        return KitPaginator { page, size in
            let r = try await repo.movements(id, page: page, pageSize: size)
            return (r.items, r.total)
        }
    }

    private func reload() { Task { await pager?.first() } }
}

/// One movement row: the localized type + signed quantity, optional cost and
/// note, the person and day.
private struct MovementRow: View {
    let movement: StockMovement
    let canViewCost: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.ui(.body)).foregroundStyle(Tokens.text)
                if let note = movement.note, !note.isEmpty {
                    Text(note).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                Text([movement.createdBy?.name, StockDate.day(movement.occurredAt)]
                    .compactMap { $0 }.joined(separator: " · "))
                    .font(.ui(.caption)).foregroundStyle(Tokens.muted)
            }
            Spacer(minLength: Tokens.Space.sm)
            VStack(alignment: .trailing, spacing: 2) {
                Text(signed)
                    .font(.data(.regular))
                    .foregroundStyle(movement.quantity < 0 ? Tokens.danger : Tokens.success)
                if canViewCost, let cost = movement.unitCostSnapshot {
                    MoneyText(value: cost, size: 12).foregroundStyle(Tokens.muted)
                }
            }
        }
    }

    private var label: String {
        let key = ["PURCHASE": "catalog.movePurchase", "SALE": "catalog.moveSale",
                   "RETURN": "catalog.moveReturn", "WRITE_OFF": "catalog.moveWriteOff",
                   "COUNT_CORRECTION": "catalog.moveCount"][movement.typeCode]
        return key.map { i18n.t($0) } ?? movement.typeLabel
    }

    private var signed: String { movement.quantity > 0 ? "+\(movement.quantity)" : "\(movement.quantity)" }
}

/// Date helper for movement rows (day portion of the ISO timestamp).
enum StockDate {
    static func day(_ iso: String?) -> String? {
        guard let iso, !iso.isEmpty else { return nil }
        return String(iso.prefix(10))
    }
}
