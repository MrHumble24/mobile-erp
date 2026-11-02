import SwiftUI

/// `/shipments` root — a segmented switch between the shipment batches and the
/// suppliers CRUD. Mounted behind `shipment.read` by the shell.
struct ShipmentsScreen: View {
    @Environment(I18n.self) private var i18n
    @State private var tab: Tab = .shipments

    private enum Tab: Hashable { case shipments, suppliers }

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $tab) {
                Text(i18n.t("shipments.title")).tag(Tab.shipments)
                Text(i18n.t("shipments.suppliers")).tag(Tab.suppliers)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            switch tab {
            case .shipments: ShipmentsListView()
            case .suppliers: SuppliersListView()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(i18n.t("nav.shipments"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            #if DEBUG
            ProcurementSelfCheck.runOnce()
            #endif
        }
    }
}
