import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/partners_screen.dart';

/// Public surface of the partners slice. Registered in `feature_registry.dart`
/// by spreading [partnersRoutes] and [partnersNavItems].
final List<RouteBase> partnersRoutes = [
  GoRoute(
    path: '/partners',
    builder: (_, _) => const PermissionGate(
      permission: 'partner.read',
      child: PartnersScreen(),
    ),
  ),
];

final List<NavItem> partnersNavItems = [
  const NavItem(
    route: '/partners',
    labelKey: 'nav.partners',
    icon: Icons.handshake_outlined,
    permission: 'partner.read',
  ),
];
