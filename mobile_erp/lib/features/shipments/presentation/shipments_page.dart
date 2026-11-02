import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import '../../suppliers/suppliers_module.dart';
import 'shipments_tab.dart';

/// `/shipments` — two tabs: the shipment batches and the suppliers CRUD.
/// Mounted behind `PermissionGate('shipment.read')` by the module.
class ShipmentsPage extends StatelessWidget {
  const ShipmentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          TabBar(
            tabs: [
              Tab(text: context.t('shipments.title')),
              Tab(text: context.t('shipments.suppliers')),
            ],
          ),
          const Expanded(
            child: TabBarView(
              children: [
                ShipmentsTab(),
                SuppliersTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
