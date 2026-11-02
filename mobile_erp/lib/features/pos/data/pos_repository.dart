import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import '../../../data/local/database.dart';
import '../../../data/local/database_provider.dart';
import 'pos_models.dart';
import 'sale_create.dart';

/// All data access for POS checkout. Reads the device from Drift first (offline
/// IMEI lookup), falls back to the server; writes a sale online or enqueues it
/// to the outbox. The ONLY place POS touches Dio or the DB.
class PosRepository {
  PosRepository(this._dio, this._db);

  final Dio _dio;
  final AppDatabase _db;

  /// Resolve a device by IMEI: cached row first, then `/devices/by-imei/:imei`.
  /// Returns null when neither has it.
  Future<ScannedDevice?> lookup(String imei) async {
    final cached = await _db.deviceDao.findByImei(imei);
    if (cached != null) return ScannedDevice.fromCache(cached);
    return runApi(() async {
      try {
        final res =
            await _dio.get<Map<String, dynamic>>('/devices/by-imei/$imei');
        return ScannedDevice.fromJson(res.data!);
      } on AppException catch (e) {
        if (e.statusCode == 404) return null;
        rethrow;
      }
    });
  }

  /// IMEIs that already have a pending `sale.create` in the outbox — used to
  /// hide a just-sold device from a fresh scan without mutating the cache.
  Stream<Set<String>> watchPendingSoldImeis() =>
      _db.outboxDao.watchAll().map((rows) => {
            for (final r in rows)
              if (r.type == 'sale.create' && r.status == 'pending')
                _imeiOf(r.payload),
          }..removeWhere((e) => e.isEmpty));

  /// Online checkout → `POST /sales`. Returns the created sale id for the receipt.
  Future<String> postSale(Map<String, dynamic> payload) => runApi(() async {
        final res = await _dio.post<Map<String, dynamic>>('/sales', data: payload);
        return '${res.data?['id'] ?? ''}';
      });

  /// Offline checkout → enqueue to the outbox; the push drain sends it later.
  Future<void> enqueueSale({
    required String clientMutationId,
    required Map<String, dynamic> payload,
    required int baseVersion,
  }) =>
      _db.outboxDao.enqueue(buildSaleOutboxEntry(
        clientMutationId: clientMutationId,
        payload: payload,
        baseVersion: baseVersion,
      ));

  /// Store default warranty days from `GET /settings` (auth-only).
  Future<int> defaultWarrantyDays() => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/settings');
        return (res.data?['defaultWarrantyDays'] as num?)?.toInt() ?? 0;
      });
}

String _imeiOf(String payloadJson) {
  final decoded = jsonDecode(payloadJson);
  return decoded is Map ? '${decoded['imei'] ?? ''}' : '';
}

final posRepositoryProvider = Provider<PosRepository>(
  (ref) => PosRepository(ref.watch(dioProvider), ref.watch(appDatabaseProvider)),
);
