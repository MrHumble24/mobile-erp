import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/reports_screen.dart';

/// Reports slice wiring. Registered in `app/router/feature_registry.dart`:
///   import 'package:mobile_erp/features/reports/reports_module.dart';
///   ...reportsRoutes    →  featureRoutes
///   ...reportsNavItems  →  appNavItems
List<RouteBase> reportsRoutes = [
  GoRoute(
    path: '/reports',
    builder: (_, _) => const PermissionGate(
      permission: 'report.finance',
      child: ReportsScreen(),
    ),
  ),
];

List<NavItem> reportsNavItems = const [
  NavItem(
    route: '/reports',
    labelKey: 'nav.reports',
    icon: Icons.bar_chart_outlined,
    permission: 'report.finance',
  ),
];
