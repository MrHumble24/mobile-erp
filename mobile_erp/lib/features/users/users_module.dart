import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/users_screen.dart';

/// Public API of the Users & Access (RBAC) slice. The integrator spreads these
/// into `app/router/feature_registry.dart`. Nothing else in `app/` changes.
List<RouteBase> usersRoutes = [
  GoRoute(
    path: '/users',
    builder: (_, _) => const PermissionGate(
      permission: 'user.manage',
      child: UsersScreen(),
    ),
  ),
];

List<NavItem> usersNavItems = const [
  NavItem(
    route: '/users',
    labelKey: 'nav.users',
    icon: Icons.manage_accounts_outlined,
    permission: 'user.manage',
  ),
];
