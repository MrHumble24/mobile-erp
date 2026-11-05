import SwiftUI

/// Catalog mode (ADR 0031): the product grid feeds the shared cart. On a phone
/// the grid fills the screen and a persistent cart bar opens the cart; on an
/// iPad the width carries the grid and the cart side by side.
struct PosCatalogPane: View {
    @Bindable var model: PosViewModel
    @Environment(\.horizontalSizeClass) private var hSize

    var body: some View {
        if hSize == .regular {
            HStack(spacing: 0) {
                grid.frame(maxWidth: .infinity)
                Divider()
                ScrollView {
                    PosCartColumn(model: model).padding(Tokens.Space.gutter)
                }
                .frame(width: 360)
                .background(Tokens.ground)
            }
        } else {
            VStack(spacing: 0) {
                grid
                PosCartBar(model: model)
            }
        }
    }

    private var grid: CatalogGridView {
        CatalogGridView(
            browser: model.catalog,
            excludeCodes: { model.cartUnitCodes },
            onPickUnit: { model.addCatalogUnit($0, entry: $1) },
            onPickQuantity: { model.addCatalogQuantity($0) })
    }
}
