import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'shipment.dart';

/// The only place that talks to `/shipments`. Reads need `shipment.read`,
/// shipment writes need `shipment.manage`, device intake needs `device.create`.
class ShipmentsRepository {
  ShipmentsRepository(this._dio);
  final Dio _dio;

  Future<List<Shipment>> list() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/shipments');
        return (res.data ?? [])
            .map((e) => Shipment.fromJson((e as Map).cast()))
            .toList();
      });

  Future<Shipment> get(String id) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/shipments/$id');
        return Shipment.fromJson(res.data!);
      });

  Future<Shipment> create(Map<String, dynamic> body) => runApi(() async {
        final res =
            await _dio.post<Map<String, dynamic>>('/shipments', data: body);
        return Shipment.fromJson(res.data!);
      });

  Future<Shipment> update(String id, Map<String, dynamic> body) =>
      runApi(() async {
        final res = await _dio.patch<Map<String, dynamic>>(
          '/shipments/$id',
          data: body,
        );
        return Shipment.fromJson(res.data!);
      });

  /// Batch-register devices on a shipment. `devices` is the raw DTO list.
  Future<List<RegisteredDevice>> addDevices(
    String id,
    List<Map<String, dynamic>> devices,
  ) =>
      runApi(() async {
        final res = await _dio.post<List<dynamic>>(
          '/shipments/$id/devices',
          data: {'devices': devices},
        );
        return (res.data ?? [])
            .map((e) => RegisteredDevice.fromJson((e as Map).cast()))
            .toList();
      });
}

final shipmentsRepositoryProvider = Provider<ShipmentsRepository>(
  (ref) => ShipmentsRepository(ref.watch(dioProvider)),
);

/// All shipments, newest first.
final shipmentsProvider = FutureProvider<List<Shipment>>(
  (ref) => ref.watch(shipmentsRepositoryProvider).list(),
);
