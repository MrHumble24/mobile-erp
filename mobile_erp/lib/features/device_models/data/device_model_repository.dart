import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'device_model.dart';

/// The only place that talks to `/device-models`. Writes need `device.update`.
class DeviceModelRepository {
  DeviceModelRepository(this._dio);
  final Dio _dio;

  Future<List<DeviceModelView>> list() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/device-models');
        return (res.data ?? const [])
            .map((e) => DeviceModelView.fromJson((e as Map).cast()))
            .toList();
      });

  Future<List<AttributeDef>> attributes(String id) => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/device-models/$id/attributes');
        return (res.data ?? const [])
            .map((e) => AttributeDef.fromJson((e as Map).cast()))
            .toList();
      });

  Future<void> create({
    required String brand,
    required String name,
    required List<AttributeDef> attributes,
  }) =>
      runApi(() => _dio.post<Map<String, dynamic>>('/device-models', data: {
            'brand': brand,
            'name': name,
            'attributes': attributes.map((a) => a.toJson()).toList(),
          }));

  Future<void> update(
    String id, {
    required String brand,
    required String name,
    required bool isActive,
    required List<AttributeDef> attributes,
  }) =>
      runApi(() => _dio.patch<Map<String, dynamic>>('/device-models/$id', data: {
            'brand': brand,
            'name': name,
            'isActive': isActive,
            'attributes': attributes.map((a) => a.toJson()).toList(),
          }));
}

final deviceModelRepositoryProvider = Provider<DeviceModelRepository>(
  (ref) => DeviceModelRepository(ref.watch(dioProvider)),
);
