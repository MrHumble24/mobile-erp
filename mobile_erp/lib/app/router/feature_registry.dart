import 'package:go_router/go_router.dart';

import 'nav_item.dart';

// Feature modules (each exports `<slice>Routes` + `<slice>NavItems`).
// device_models, stock_alerts and suppliers own no standalone route/nav —
// they are composed as tabs inside devices / shipments, so they are not
// imported here (pulled in transitively by their parent slice).
import '../../features/dashboard/dashboard_module.dart';
import '../../features/pos/pos_module.dart';
import '../../features/devices/devices_module.dart';
import '../../features/shipments/shipments_module.dart';
import '../../features/qc/qc_module.dart';
import '../../features/sales/sales_module.dart';
import '../../features/customers/customers_module.dart';
import '../../features/consignments/consignments_module.dart';
import '../../features/partners/partners_module.dart';
import '../../features/expenses/expenses_module.dart';
import '../../features/reports/reports_module.dart';
import '../../features/users/users_module.dart';
import '../../features/settings/settings_module.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// THE EXTENSION POINT (integrator-owned). Each feature slice exports, from
/// `features/<slice>/<slice>_module.dart`:
///   • `List<RouteBase> <slice>Routes`   — its go_router routes (under the shell)
///   • `List<NavItem>  <slice>NavItems`   — its nav entries (may be empty)
/// To register a feature: add its import above, then spread its two lists below.
/// Routes needing a permission wrap their screen in `PermissionGate`.
/// ─────────────────────────────────────────────────────────────────────────

/// Nav entries shown in the shell, in display order.
List<NavItem> appNavItems = [
  ...dashboardNavItems,
  ...posNavItems,
  ...devicesNavItems,
  ...shipmentsNavItems,
  ...qcNavItems,
  ...salesNavItems,
  ...customersNavItems,
  ...consignmentsNavItems,
  ...partnersNavItems,
  ...expensesNavItems,
  ...reportsNavItems,
  ...usersNavItems,
  ...settingsNavItems,
];

/// Feature routes mounted inside the authenticated AppShell.
List<RouteBase> featureRoutes = [
  ...dashboardRoutes,
  ...posRoutes,
  ...devicesRoutes,
  ...shipmentsRoutes,
  ...qcRoutes,
  ...salesRoutes,
  ...customersRoutes,
  ...consignmentsRoutes,
  ...partnersRoutes,
  ...expensesRoutes,
  ...reportsRoutes,
  ...usersRoutes,
  ...settingsRoutes,
];
