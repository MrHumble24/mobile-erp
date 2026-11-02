import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'auth_models.dart';

/// The only place that talks to the `/auth/*` endpoints.
class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  Future<LoginResult> login(String email, String password) => runApi(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/auth/login',
          data: {'email': email, 'password': password},
        );
        final data = res.data!;
        return LoginResult(
          token: data['accessToken'] as String,
          user: AuthUser.fromJson((data['user'] as Map).cast()),
        );
      });

  Future<AuthUser> me() => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/auth/me');
        return AuthUser.fromJson(res.data!);
      });
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioProvider)),
);
