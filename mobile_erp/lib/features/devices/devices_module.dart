import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/inventory_page.dart';

/// Routes contributed by the devices slice (owns the inventory page + tabs).
final List<RouteBase> devicesRoutes = [
  GoRoute(
    path: '/inventory',
    builder: (_, _) => const PermissionGate(
      permission: 'device.read',
      child: InventoryPage(),
    ),
  ),
];

/// Nav entry for the inventory section.
const List<NavItem> devicesNavItems = [
  NavItem(
    route: '/inventory',
    labelKey: 'nav.inventory',
    icon: Icons.smartphone,
    permission: 'device.read',
  ),
];
