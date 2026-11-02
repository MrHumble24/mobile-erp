import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_exception.dart';
import '../../core/dio_provider.dart';
import '../local/database.dart';
import '../local/database_provider.dart';
import 'terminal_id.dart';

/// Drains the `outbox` through `POST /sync/push`. Mutations are sent in
/// occurredAt order (the server applies them in order) and each result is
/// reconciled:
///  - applied | duplicate → delete the entry (a later pull refreshes records),
///  - conflict            → mark `conflict` (surfaced in the conflict inbox),
///  - rejected            → mark `rejected`, keep it, flag the error.
///
/// Nothing is ever silently dropped.
class PushService {
  PushService(this._dio, this._db, this._terminalId);

  final Dio _dio;
  final AppDatabase _db;
  final Future<String> Function() _terminalId;

  Future<void> drain() => runApi(_drain);

  Future<void> _drain() async {
    final pending = await _db.outboxDao.pending();
    if (pending.isEmpty) return;

    final res = await _dio.post<Map<String, dynamic>>(
      '/sync/push',
      data: {
        'terminalId': await _terminalId(),
        'mutations': [
          for (final m in pending)
            {
              'id': m.id,
              'type': m.type,
              'payload': jsonDecode(m.payload),
              'baseVersion': ?m.baseVersion,
              'occurredAt': m.occurredAt,
            },
        ],
      },
    );

    final results = (res.data?['results'] as List? ?? const [])
        .cast<Map<String, dynamic>>();
    for (final r in results) {
      await _apply(r);
    }
  }

  Future<void> _apply(Map<String, dynamic> r) async {
    final id = r['id'] as String;
    switch (r['status'] as String?) {
      case 'applied':
      case 'duplicate':
        await _db.outboxDao.remove(id);
      case 'conflict':
        await _db.outboxDao.markStatus(
          id,
          'conflict',
          error: r['conflictId']?.toString(),
        );
      default: // 'rejected' or anything unexpected → keep + flag
        await _db.outboxDao.markStatus(
          id,
          'rejected',
          error: r['error']?.toString() ?? 'rejected',
        );
    }
  }
}

final pushServiceProvider = Provider<PushService>(
  (ref) => PushService(
    ref.watch(dioProvider),
    ref.watch(appDatabaseProvider),
    () => ref.read(terminalIdProvider.future),
  ),
);
