import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'device_model.dart';

/// Read-only access to `/device-models` (perm `device.read`). Procurement owns
/// this until an inventory slice lands; QC imports it for the model-name map.
class DeviceModelsRepository {
  DeviceModelsRepository(this._dio);
  final Dio _dio;

  Future<List<DeviceModel>> list() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/device-models');
        return (res.data ?? [])
            .map((e) => DeviceModel.fromJson((e as Map).cast()))
            .toList();
      });
}

final deviceModelsRepositoryProvider = Provider<DeviceModelsRepository>(
  (ref) => DeviceModelsRepository(ref.watch(dioProvider)),
);

/// All catalog models. Used by intake (picker + spec schema) and the QC queue.
final deviceModelsProvider = FutureProvider<List<DeviceModel>>(
  (ref) => ref.watch(deviceModelsRepositoryProvider).list(),
);

/// modelId → "Brand Name", for rendering device rows.
final deviceModelNamesProvider = Provider<Map<String, String>>((ref) {
  final models = ref.watch(deviceModelsProvider).valueOrNull ?? const [];
  return {for (final m in models) m.id: m.label};
});
