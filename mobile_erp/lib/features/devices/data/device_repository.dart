import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import '../../../data/local/database.dart';
import '../../../data/local/database_provider.dart';
import 'device.dart';

/// Devices data access. Reads come from the offline Drift cache (hydrated by
/// `/sync/changes`); detail, history and writes go to the API online-only.
class DeviceRepository {
  DeviceRepository(this._dio, this._db);

  final Dio _dio;
  final AppDatabase _db;

  /// Reactive offline device list — emits on every cache change.
  Stream<List<DeviceListItem>> watchDevices() => _db.deviceDao
      .watchAll()
      .map((rows) => rows.map(DeviceListItem.fromRow).toList());

  Future<DeviceDetail> detailByImei(String imei) => runApi(() async {
        final res =
            await _dio.get<Map<String, dynamic>>('/devices/by-imei/$imei');
        return DeviceDetail.fromJson(res.data!);
      });

  Future<List<DeviceHistoryEntry>> history(String id) => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/devices/$id/history');
        return (res.data ?? const [])
            .map((e) => DeviceHistoryEntry.fromJson((e as Map).cast()))
            .toList();
      });

  Future<void> update(
    String id, {
    required Map<String, dynamic> specs,
    required double? targetPrice,
  }) =>
      runApi(() => _dio.patch<Map<String, dynamic>>('/devices/$id',
          data: {'specs': specs, 'targetPrice': targetPrice}));

  /// Throws [AppException] with statusCode 409 on a version mismatch.
  Future<void> changeStatus(
    String id, {
    required String toStatusCode,
    required int expectedVersion,
    String? reason,
  }) =>
      runApi(() => _dio.post<Map<String, dynamic>>('/devices/$id/status', data: {
            'toStatusCode': toStatusCode,
            'expectedVersion': expectedVersion,
            if (reason != null && reason.isNotEmpty) 'reason': reason,
          }));
}

final deviceRepositoryProvider = Provider<DeviceRepository>(
  (ref) => DeviceRepository(
    ref.watch(dioProvider),
    ref.watch(appDatabaseProvider),
  ),
);
