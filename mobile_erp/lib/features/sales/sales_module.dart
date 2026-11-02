import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/sales_screen.dart';

/// Sales & warranty slice. Registered in `app/router/feature_registry.dart`:
///   import 'package:mobile_erp/features/sales/sales_module.dart';
///   ...salesRoutes   → featureRoutes
///   ...salesNavItems → appNavItems
const _salesPermission = 'sale.read';

final List<RouteBase> salesRoutes = [
  GoRoute(
    path: '/sales',
    builder: (_, _) => const PermissionGate(
      permission: _salesPermission,
      child: SalesScreen(),
    ),
  ),
];

final List<NavItem> salesNavItems = [
  const NavItem(
    route: '/sales',
    labelKey: 'nav.sales',
    icon: Icons.point_of_sale_outlined,
    permission: _salesPermission,
  ),
];
