import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'settings_models.dart';

/// The only place that talks to `/settings`.
class SettingsRepository {
  SettingsRepository(this._dio);
  final Dio _dio;

  Future<StoreSettings> get() => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/settings');
        return StoreSettings.fromJson(res.data!);
      });

  Future<StoreSettings> update(Map<String, dynamic> dto) => runApi(() async {
        final res = await _dio.put<Map<String, dynamic>>('/settings', data: dto);
        return StoreSettings.fromJson(res.data!);
      });
}

final settingsRepositoryProvider = Provider<SettingsRepository>(
  (ref) => SettingsRepository(ref.watch(dioProvider)),
);
