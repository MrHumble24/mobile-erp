import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/settings_screen.dart';

/// Public API of the Settings slice. The integrator spreads these into
/// `app/router/feature_registry.dart`.
List<RouteBase> settingsRoutes = [
  GoRoute(
    path: '/settings',
    builder: (_, _) => const PermissionGate(
      permission: 'settings.manage',
      child: SettingsScreen(),
    ),
  ),
];

List<NavItem> settingsNavItems = const [
  NavItem(
    route: '/settings',
    labelKey: 'nav.settings',
    icon: Icons.settings_outlined,
    permission: 'settings.manage',
  ),
];
