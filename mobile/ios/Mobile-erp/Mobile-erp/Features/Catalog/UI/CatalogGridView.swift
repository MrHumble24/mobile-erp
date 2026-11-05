import SwiftUI

/// The till's catalog mode (ADR 0031): a search field, category chips and a grid
/// of product cards. A card tap runs `CatalogPick` — a quantity product goes
/// straight to the cart, a unit product with one free unit too, otherwise the
/// unit picker opens. Units already in the cart (`excludeCodes`) are never
/// offered again. Feeds the shared POS cart through the two callbacks.
struct CatalogGridView: View {
    @Bindable var browser: CatalogBrowser
    let excludeCodes: () -> Set<String>
    let onPickUnit: (CatalogUnit, CatalogEntry) -> Void
    let onPickQuantity: (CatalogEntry) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var picker: CatalogPickerData?

    private let columns = [GridItem(.adaptive(minimum: 150, maximum: 240), spacing: Tokens.Space.md)]

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            AppTextField(placeholder: i18n.t("catalog.searchProducts"), text: $browser.search,
                         autocapitalization: .never, disableAutocorrection: true)
                .padding(.horizontal, Tokens.Space.gutter)
            if !browser.categories.isEmpty { chips }
            grid
        }
        .padding(.top, Tokens.Space.sm)
        .appSheet(item: $picker) { data in
            CatalogUnitPickerSheet(entry: data.entry, units: data.units) { onPickUnit($0, data.entry) }
        }
        .task {
            browser.configure(container)
            await browser.loadCategories()
            await browser.load()
            #if DEBUG
            // Screenshot helper: `-posCatalogPick <modelId>` opens the unit picker
            // for that product once the grid has loaded.
            if let modelId = KitDebugLaunch.consume("posCatalogPick"),
               let entry = browser.entries.first(where: { $0.modelId == modelId }) {
                picker = CatalogPickerData(entry: entry, units: await browser.units(for: entry))
            }
            #endif
        }
    }

    private var chips: some View {
        TabChips(selection: $browser.categoryId, items:
            [TabChipItem(value: String?.none, label: i18n.t("catalog.allProducts"))]
            + browser.categories.filter { $0.isActive || $0.id == browser.categoryId }
                .map { TabChipItem(value: String?.some($0.id), label: $0.name) })
    }

    @ViewBuilder private var grid: some View {
        if browser.loading && browser.entries.isEmpty {
            LoadingView().frame(maxWidth: .infinity).padding(.vertical, Tokens.Space.gutter)
        } else if let error = browser.loadError, browser.entries.isEmpty {
            AppCard { ErrorStateView(message: error, retry: { Task { await browser.load() } }) }
                .padding(.horizontal, Tokens.Space.gutter)
        } else if browser.entries.isEmpty {
            EmptyStateView(systemImage: "square.grid.2x2", title: i18n.t("catalog.noUnits"))
                .frame(maxWidth: .infinity).padding(.vertical, Tokens.Space.gutter)
        } else {
            ScrollView {
                LazyVGrid(columns: columns, spacing: Tokens.Space.md) {
                    ForEach(browser.entries) { entry in
                        CatalogCard(entry: entry) { tap(entry) }
                    }
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.bottom, Tokens.Space.lg)
            }
        }
    }

    private func tap(_ entry: CatalogEntry) {
        switch CatalogPick.tap(entry) {
        case .quantity(let e):
            onPickQuantity(e)
            Haptic.success.play()
        case .needsUnits(let e):
            Task {
                let units = await browser.units(for: e)
                switch CatalogPick.resolveUnits(units, excludingCodes: excludeCodes()) {
                case .none:
                    container.toasts.error(i18n.t("catalog.noUnits"))
                    Haptic.error.play()
                case .one(let unit):
                    onPickUnit(unit, e)
                    Haptic.success.play()
                case .pick(let free):
                    picker = CatalogPickerData(entry: e, units: free)
                }
            }
        }
    }
}

/// Drives the unit picker sheet (`.sheet(item:)`).
private struct CatalogPickerData: Identifiable {
    let entry: CatalogEntry
    let units: [CatalogUnit]
    var id: String { entry.modelId }
}
