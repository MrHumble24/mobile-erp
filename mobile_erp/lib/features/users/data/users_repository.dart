import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'access_models.dart';

/// The only place that talks to `/users` and `/access`. Plain async functions,
/// each wrapped in [runApi] so callers see a normalized [AppException].
class UsersRepository {
  UsersRepository(this._dio);
  final Dio _dio;

  Future<List<UserView>> listUsers() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/users');
        return (res.data ?? const [])
            .map((e) => UserView.fromJson((e as Map).cast()))
            .toList();
      });

  Future<void> createUser({
    required String email,
    required String password,
    required Map<String, dynamic> profile,
    required List<String> roleCodes,
  }) =>
      runApi(() async {
        await _dio.post<Map<String, dynamic>>('/users', data: {
          'email': email,
          'password': password,
          'profile': profile,
          'roleCodes': roleCodes,
        });
      });

  Future<void> setActive(String id, bool isActive) => runApi(() async {
        await _dio.patch<Map<String, dynamic>>('/users/$id',
            data: {'isActive': isActive});
      });

  Future<void> setRoles(String id, List<String> roleCodes) => runApi(() async {
        await _dio.put<Map<String, dynamic>>('/users/$id/roles',
            data: {'roleCodes': roleCodes});
      });

  Future<void> setPermissions(String id, List<PermissionOverride> overrides) =>
      runApi(() async {
        await _dio.put<Map<String, dynamic>>('/users/$id/permissions',
            data: {'overrides': [for (final o in overrides) o.toJson()]});
      });

  Future<List<RoleView>> listRoles() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/access/roles');
        return (res.data ?? const [])
            .map((e) => RoleView.fromJson((e as Map).cast()))
            .toList();
      });

  Future<List<PermissionView>> listPermissions() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/access/permissions');
        return (res.data ?? const [])
            .map((e) => PermissionView.fromJson((e as Map).cast()))
            .toList();
      });

  Future<void> createRole({
    required String code,
    required String name,
    String? description,
  }) =>
      runApi(() async {
        await _dio.post<Map<String, dynamic>>('/access/roles', data: {
          'code': code,
          'name': name,
          if (description != null && description.isNotEmpty)
            'description': description,
        });
      });

  Future<void> setRolePermissions(String code, List<String> permissionCodes) =>
      runApi(() async {
        await _dio.put<Map<String, dynamic>>('/access/roles/$code/permissions',
            data: {'permissionCodes': permissionCodes});
      });
}

final usersRepositoryProvider = Provider<UsersRepository>(
  (ref) => UsersRepository(ref.watch(dioProvider)),
);
