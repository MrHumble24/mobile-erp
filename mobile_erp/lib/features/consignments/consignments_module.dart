import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/consignments_screen.dart';

/// Public surface of the consignments slice. Registered in
/// `feature_registry.dart` by spreading [consignmentsRoutes] and
/// [consignmentsNavItems].
final List<RouteBase> consignmentsRoutes = [
  GoRoute(
    path: '/consignments',
    builder: (_, _) => const PermissionGate(
      permission: 'consignment.read',
      child: ConsignmentsScreen(),
    ),
  ),
];

final List<NavItem> consignmentsNavItems = [
  const NavItem(
    route: '/consignments',
    labelKey: 'nav.consignments',
    icon: Icons.sync_alt,
    permission: 'consignment.read',
  ),
];
