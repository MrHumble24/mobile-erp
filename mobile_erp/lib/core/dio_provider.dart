import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_exception.dart';
import 'auth_events.dart';
import 'dev_config.dart';
import 'secure_storage.dart';

/// The single configured [Dio]. The ONLY HTTP client in the app.
///
/// Interceptor responsibilities (mirrors the web `shared/api/http.ts`):
///  - attach `Authorization: Bearer <token>` from secure storage,
///  - on 401: wipe the stored token + signal [AuthEvents] (→ login),
///  - turn every [DioException] into a normalized [AppException].
final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final events = ref.watch(authEventsProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: ref.watch(apiBaseUrlProvider),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      // Keep the raw envelope on errors; we map it ourselves.
      validateStatus: (code) => code != null && code >= 200 && code < 300,
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        // ponytail: secure-storage read per request — fine at store scale;
        // cache in memory only if request volume ever makes it show up.
        final token = await storage.read(key: SecureKeys.token);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (e, handler) async {
        // A 401 on the login endpoint is "bad credentials", not a dead session.
        final isLogin = e.requestOptions.path.endsWith('/auth/login');
        if (e.response?.statusCode == 401 && !isLogin) {
          await storage.delete(key: SecureKeys.token);
          await storage.delete(key: SecureKeys.user);
          events.signalUnauthorized();
        }
        handler.reject(
          DioException(
            requestOptions: e.requestOptions,
            response: e.response,
            type: e.type,
            error: AppException.fromDio(e),
          ),
        );
      },
    ),
  );

  return dio;
});
