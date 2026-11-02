import 'package:go_router/go_router.dart';

import 'nav_item.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// THE EXTENSION POINT. This is the ONLY shared file a feature touches, and it
/// adds exactly TWO one-line spreads — never editing another agent's code.
///
/// Each feature slice exports, from `features/<slice>/<slice>_module.dart`:
///   • `List<RouteBase> <slice>Routes`     — its go_router routes (under the shell)
///   • `List<NavItem>  <slice>NavItems`    — its nav entries (may be empty)
///
/// To register a feature:
///   1. add its import below,
///   2. spread `...<slice>Routes` into [featureRoutes],
///   3. spread `...<slice>NavItems` into [appNavItems].
/// Routes needing a permission wrap their screen in `PermissionGate` (app/widgets).
///
/// TODO wave 2 — inventory:    import features/inventory/inventory_module.dart
/// TODO wave 3 — procurement:  import features/procurement/procurement_module.dart
/// TODO wave 3 — qc:           import features/qc/qc_module.dart
/// TODO wave 4 — sales/pos:    import features/sales/sales_module.dart
/// TODO wave 5 — consignment:  import features/consignment/consignment_module.dart
/// TODO wave 6 — finance:      import features/finance/finance_module.dart
/// TODO wave 7 — sync/admin:   import features/admin/admin_module.dart
/// ─────────────────────────────────────────────────────────────────────────

/// Nav entries shown in the shell, in order. Spread each feature's list here.
List<NavItem> appNavItems = [
  // ...inventoryNavItems,
];

/// Feature routes mounted inside the authenticated AppShell. Spread each here.
List<RouteBase> featureRoutes = [
  // ...inventoryRoutes,
];
