import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import '../../app/widgets/permission_gate.dart';
import 'presentation/qc_page.dart';

/// `/qc` route, gated on `qc.read`.
final List<RouteBase> qcRoutes = [
  GoRoute(
    path: '/qc',
    builder: (_, _) => const PermissionGate(
      permission: 'qc.read',
      child: QcPage(),
    ),
  ),
];

/// Nav entry for the QC section.
const List<NavItem> qcNavItems = [
  NavItem(
    route: '/qc',
    labelKey: 'nav.qc',
    icon: Icons.fact_check_outlined,
    permission: 'qc.read',
  ),
];
