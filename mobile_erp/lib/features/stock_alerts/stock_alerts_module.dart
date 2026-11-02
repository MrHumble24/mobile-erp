import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';

// Public API of the stock_alerts slice — other slices import only this file.
export 'application/stock_alerts_providers.dart';
export 'data/stock_alert.dart';
export 'presentation/stock_alerts_tab.dart';

/// No standalone routes: the Alerts tab is composed inside the inventory page.
const List<RouteBase> stockAlertsRoutes = [];

/// No nav entry: reached via the inventory page's tabs.
const List<NavItem> stockAlertsNavItems = [];
