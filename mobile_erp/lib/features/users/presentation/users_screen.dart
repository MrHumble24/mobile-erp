import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import 'tabs/permission_matrix_tab.dart';
import 'tabs/roles_tab.dart';
import 'tabs/users_tab.dart';

/// Users & Access (RBAC) screen: three tabs — Users, Roles, Permission Matrix.
/// Mounted under the AppShell (which supplies the Scaffold + app bar).
class UsersScreen extends StatelessWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          Material(
            color: Theme.of(context).colorScheme.surface,
            child: TabBar(
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              tabs: [
                Tab(text: context.t('users.tabUsers')),
                Tab(text: context.t('users.tabRoles')),
                Tab(text: context.t('users.tabPermissions')),
              ],
            ),
          ),
          const Expanded(
            child: TabBarView(
              children: [UsersTab(), RolesTab(), PermissionMatrixTab()],
            ),
          ),
        ],
      ),
    );
  }
}
