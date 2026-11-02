import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'stock_alert.dart';

/// The only place that talks to `/stock-alert-rules`. Writes need `settings.manage`.
class StockAlertRepository {
  StockAlertRepository(this._dio);
  final Dio _dio;

  Future<List<LowStockView>> lowStock() => runApi(() async {
        final res =
            await _dio.get<List<dynamic>>('/stock-alert-rules/low-stock');
        return (res.data ?? const [])
            .map((e) => LowStockView.fromJson((e as Map).cast()))
            .toList();
      });

  Future<List<StockAlertRuleView>> list() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/stock-alert-rules');
        return (res.data ?? const [])
            .map((e) => StockAlertRuleView.fromJson((e as Map).cast()))
            .toList();
      });

  Future<void> create({
    required String modelId,
    required String storage,
    required int threshold,
  }) =>
      runApi(() => _dio.post<Map<String, dynamic>>('/stock-alert-rules', data: {
            'modelId': modelId,
            'storage': storage,
            'threshold': threshold,
          }));

  Future<void> update(
    String id, {
    required String storage,
    required int threshold,
  }) =>
      runApi(() => _dio.patch<Map<String, dynamic>>('/stock-alert-rules/$id',
          data: {'storage': storage, 'threshold': threshold}));
}

final stockAlertRepositoryProvider = Provider<StockAlertRepository>(
  (ref) => StockAlertRepository(ref.watch(dioProvider)),
);
