import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import 'presentation/dashboard_screen.dart';

/// Dashboard slice wiring. Registered in `app/router/feature_registry.dart`:
///   import 'package:mobile_erp/features/dashboard/dashboard_module.dart';
///   ...dashboardRoutes    →  featureRoutes
///   ...dashboardNavItems  →  appNavItems
///
/// Exported at `/dashboard`. The integrator wires [DashboardScreen] as the index
/// `/` (replacing the wave-0 home placeholder); keep this `/dashboard` route too
/// or drop it once `/` points here — both render the same screen. Auth-only: no
/// `PermissionGate`, every data section inside is gated by its own permission.
List<RouteBase> dashboardRoutes = [
  GoRoute(path: '/dashboard', builder: (_, _) => const DashboardScreen()),
];

List<NavItem> dashboardNavItems = const [
  NavItem(
    route: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: Icons.dashboard_outlined,
  ),
];
