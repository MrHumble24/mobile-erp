import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../auth/application/permissions.dart';
import '../../device_models/device_models_module.dart';
import '../../stock_alerts/stock_alerts_module.dart';
import 'devices_tab.dart';

/// The inventory page: Devices / Models / Alerts tabs. Mounted at `/inventory`
/// behind a `device.read` gate. The Models tab needs `device.update`.
class InventoryPage extends ConsumerStatefulWidget {
  const InventoryPage({super.key});

  @override
  ConsumerState<InventoryPage> createState() => _InventoryPageState();
}

class _InventoryPageState extends ConsumerState<InventoryPage>
    with TickerProviderStateMixin {
  TabController? _controller;
  int _length = 0;

  TabController _ensureController(int length) {
    if (_controller == null || _length != length) {
      _controller?.dispose();
      _controller = TabController(length: length, vsync: this);
      _length = length;
    }
    return _controller!;
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final can = ref.watch(canProvider);
    final showModels = can('device.update');

    final tabs = <Tab>[
      Tab(text: context.t('inventory.tabDevices')),
      if (showModels) Tab(text: context.t('inventory.tabModels')),
      Tab(text: context.t('inventory.tabAlerts')),
    ];
    final alertsIndex = showModels ? 2 : 1;
    final controller = _ensureController(tabs.length);

    final views = <Widget>[
      DevicesTab(onShowAlerts: () => controller.animateTo(alertsIndex)),
      if (showModels) const DeviceModelsTab(),
      const StockAlertsTab(),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TabBar(controller: controller, tabs: tabs, isScrollable: true),
          Expanded(
            child: TabBarView(controller: controller, children: views),
          ),
        ],
      ),
    );
  }
}
