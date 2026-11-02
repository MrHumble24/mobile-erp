import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/customers_screen.dart';

/// Customers slice. Registered in `app/router/feature_registry.dart`:
///   import 'package:mobile_erp/features/customers/customers_module.dart';
///   ...customersRoutes   → featureRoutes
///   ...customersNavItems → appNavItems
///
/// No `nav.customers` key exists — the nav label reuses `sales.customersTitle`.
const _customerPermission = 'customer.read';

final List<RouteBase> customersRoutes = [
  GoRoute(
    path: '/customers',
    builder: (_, _) => const PermissionGate(
      permission: _customerPermission,
      child: CustomersScreen(),
    ),
  ),
];

final List<NavItem> customersNavItems = [
  const NavItem(
    route: '/customers',
    labelKey: 'sales.customersTitle',
    icon: Icons.people_outline,
    permission: _customerPermission,
  ),
];
