import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/access_models.dart';
import '../data/users_repository.dart';

/// Users list + the write actions on a user. A read is the AsyncNotifier state;
/// each write calls the repository then refreshes the list.
class UsersController extends AsyncNotifier<List<UserView>> {
  UsersRepository get _repo => ref.read(usersRepositoryProvider);

  @override
  Future<List<UserView>> build() => _repo.listUsers();

  Future<void> _refresh() async {
    state = await AsyncValue.guard(_repo.listUsers);
  }

  Future<void> create({
    required String email,
    required String password,
    required Map<String, dynamic> profile,
    required List<String> roleCodes,
  }) async {
    await _repo.createUser(
        email: email, password: password, profile: profile, roleCodes: roleCodes);
    await _refresh();
  }

  Future<void> setRoles(String id, List<String> roleCodes) async {
    await _repo.setRoles(id, roleCodes);
    await _refresh();
  }

  Future<void> setPermissions(String id, List<PermissionOverride> o) async {
    await _repo.setPermissions(id, o);
  }

  Future<void> setActive(String id, bool isActive) async {
    await _repo.setActive(id, isActive);
    await _refresh();
  }
}

final usersControllerProvider =
    AsyncNotifierProvider<UsersController, List<UserView>>(UsersController.new);

/// Roles list + role writes. Shared by the Roles tab and the Users dialogs.
class RolesController extends AsyncNotifier<List<RoleView>> {
  UsersRepository get _repo => ref.read(usersRepositoryProvider);

  @override
  Future<List<RoleView>> build() => _repo.listRoles();

  Future<void> _refresh() async {
    state = await AsyncValue.guard(_repo.listRoles);
  }

  Future<void> create({
    required String code,
    required String name,
    String? description,
  }) async {
    await _repo.createRole(code: code, name: name, description: description);
    await _refresh();
  }

  Future<void> setPermissions(String code, List<String> permissionCodes) async {
    await _repo.setRolePermissions(code, permissionCodes);
    await _refresh();
  }
}

final rolesControllerProvider =
    AsyncNotifierProvider<RolesController, List<RoleView>>(RolesController.new);

/// All permission definitions. Read-only; never mutated at runtime.
final permissionsListProvider = FutureProvider<List<PermissionView>>(
  (ref) => ref.watch(usersRepositoryProvider).listPermissions(),
);
