import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/expenses_screen.dart';

/// Expenses slice wiring. Registered in `app/router/feature_registry.dart`:
///   import 'package:mobile_erp/features/expenses/expenses_module.dart';
///   ...expensesRoutes  →  featureRoutes
///   ...expensesNavItems →  appNavItems
List<RouteBase> expensesRoutes = [
  GoRoute(
    path: '/expenses',
    builder: (_, _) => const PermissionGate(
      permission: 'expense.read',
      child: ExpensesScreen(),
    ),
  ),
];

List<NavItem> expensesNavItems = const [
  NavItem(
    route: '/expenses',
    labelKey: 'nav.expenses',
    icon: Icons.receipt_long_outlined,
    permission: 'expense.read',
  ),
];
