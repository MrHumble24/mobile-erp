import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/shipments_page.dart';

// Public surface — the QC slice imports the shared device/model reads from here.
export 'data/device_model.dart';
export 'data/device_models_repository.dart';
export 'data/devices_repository.dart';
export 'data/shipment_device.dart';

/// `/shipments` route, gated on `shipment.read`.
final List<RouteBase> shipmentsRoutes = [
  GoRoute(
    path: '/shipments',
    builder: (_, _) => const PermissionGate(
      permission: 'shipment.read',
      child: ShipmentsPage(),
    ),
  ),
];

/// Nav entry for the Shipments section.
const List<NavItem> shipmentsNavItems = [
  NavItem(
    route: '/shipments',
    labelKey: 'nav.shipments',
    icon: Icons.local_shipping_outlined,
    permission: 'shipment.read',
  ),
];
