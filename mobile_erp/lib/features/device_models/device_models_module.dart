import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';

// Public API of the device_models slice — other slices import only this file.
export 'application/device_models_providers.dart';
export 'data/device_model.dart';
export 'presentation/device_models_tab.dart';
export 'presentation/dynamic_spec_fields.dart';

/// No standalone routes: the Models tab is composed inside the inventory page.
const List<RouteBase> deviceModelsRoutes = [];

/// No nav entry: reached via the inventory page's tabs.
const List<NavItem> deviceModelsNavItems = [];
