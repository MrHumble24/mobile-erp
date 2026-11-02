import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/pos_screen.dart';

/// POS terminal slice. Registered in `app/router/feature_registry.dart`:
///   import 'package:mobile_erp/features/pos/pos_module.dart';
///   ...posRoutes   → featureRoutes
///   ...posNavItems → appNavItems
const _posPermission = 'sale.create';

final List<RouteBase> posRoutes = [
  GoRoute(
    path: '/pos',
    builder: (_, _) => const PermissionGate(
      permission: _posPermission,
      child: Scaffold(body: PosScreen()),
    ),
  ),
];

final List<NavItem> posNavItems = [
  const NavItem(
    route: '/pos',
    labelKey: 'nav.pos',
    icon: Icons.point_of_sale,
    permission: _posPermission,
  ),
];
