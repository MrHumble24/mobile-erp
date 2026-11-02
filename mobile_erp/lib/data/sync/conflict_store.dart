import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_exception.dart';
import '../../core/dio_provider.dart';

/// Server-side sync conflicts (perm `sync.resolve`). Wave 7 builds the inbox UI
/// on top of this; wave 0 ships the fetch + resolve calls.
class ConflictStore {
  ConflictStore(this._dio);
  final Dio _dio;

  /// Raw conflict rows from `GET /sync/conflicts` (shape owned by the server).
  Future<List<Map<String, dynamic>>> list() => runApi(() async {
        final res = await _dio.get<dynamic>('/sync/conflicts');
        final data = res.data;
        final rows = data is List ? data : (data?['conflicts'] as List? ?? []);
        return rows.cast<Map<String, dynamic>>();
      });

  /// `POST /sync/conflicts/:id/resolve` with `keep-server` or `apply-terminal`.
  Future<void> resolve(String id, String resolution, {String? note}) =>
      runApi(() async {
        await _dio.post<void>(
          '/sync/conflicts/$id/resolve',
          data: {'resolution': resolution, 'note': ?note},
        );
      });
}

final conflictStoreProvider = Provider<ConflictStore>(
  (ref) => ConflictStore(ref.watch(dioProvider)),
);
