import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';

// Public surface — other procurement slices import these from the module.
export 'data/supplier.dart';
export 'data/suppliers_repository.dart';
export 'presentation/online_guard.dart';
export 'presentation/suppliers_tab.dart';

/// Suppliers has no route or nav entry of its own: its UI is the "Suppliers"
/// tab inside the Shipments page (`/shipments`). These empty lists keep the
/// extension contract uniform; registering them is a no-op.
const List<RouteBase> suppliersRoutes = [];
const List<NavItem> suppliersNavItems = [];
