import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_exception.dart';
import '../../core/dio_provider.dart';
import '../local/database.dart';
import '../local/database_provider.dart';
import '../local/tables.dart';
import 'sync_dto.dart';

/// Drains `GET /sync/changes` into Drift. Pages from the stored cursor until
/// `nextSince` is null, upserting devices + partners and saving the cursor
/// after each page (so a crash mid-pull resumes, not restarts).
class PullService {
  PullService(this._dio, this._db);

  final Dio _dio;
  final AppDatabase _db;

  Future<void> pull() => runApi(_drain);

  Future<void> _drain() async {
    var since = await _db.syncMetaDao.get(SyncMetaKeys.cursor);
    // Guard against a server that never advances the cursor.
    for (var guard = 0; guard < 1000; guard++) {
      final res = await _dio.get<Map<String, dynamic>>(
        '/sync/changes',
        queryParameters: since == null ? null : {'since': since},
      );
      final page = ChangesPage.fromJson(res.data ?? const {});
      await _db.transaction(() async {
        if (page.devices.isNotEmpty) {
          await _db.deviceDao.upsertAll(page.devices);
        }
        if (page.partners.isNotEmpty) {
          await _db.partnerDao.upsertAll(page.partners);
        }
        if (page.nextSince != null) {
          await _db.syncMetaDao.set(SyncMetaKeys.cursor, page.nextSince!);
        }
      });
      if (page.nextSince == null) break;
      since = page.nextSince;
    }
  }
}

final pullServiceProvider = Provider<PullService>(
  (ref) => PullService(ref.watch(dioProvider), ref.watch(appDatabaseProvider)),
);
