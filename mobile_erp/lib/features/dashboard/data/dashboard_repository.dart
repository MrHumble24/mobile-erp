import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'dashboard_models.dart';

/// Reads the dashboard's data sources. Each endpoint needs its own permission
/// (guarded in the UI), so this repo exposes them separately rather than as one
/// aggregate call. All online reads.
class DashboardRepository {
  DashboardRepository(this._dio);
  final Dio _dio;

  Future<DashProfit> profit({DateTime? from, DateTime? to}) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/reports/profit',
          queryParameters: {
            if (from != null) 'from': from.toIso8601String(),
            if (to != null) 'to': to.toIso8601String(),
          },
        );
        return DashProfit.fromJson(res.data!);
      });

  Future<List<DashModelPricingRow>> modelPricing() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/reports/model-pricing');
        return [
          for (final row in res.data ?? const [])
            DashModelPricingRow.fromJson((row as Map).cast()),
        ];
      });

  Future<List<LowStockItem>> lowStock() => runApi(() async {
        final res =
            await _dio.get<List<dynamic>>('/stock-alert-rules/low-stock');
        return [
          for (final row in res.data ?? const [])
            LowStockItem.fromJson((row as Map).cast()),
        ];
      });

  Future<List<OverdueConsignment>> overdue() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/consignments/overdue');
        return [
          for (final row in res.data ?? const [])
            OverdueConsignment.fromJson((row as Map).cast()),
        ];
      });

  /// Model id → readable label; empty when the user may not read device models.
  Future<Map<String, String>> deviceModelLabels() async {
    try {
      final res = await _dio.get<List<dynamic>>('/device-models');
      return {
        for (final row in res.data ?? const [])
          (row as Map)['id'] as String:
              '${row['brand'] ?? ''} ${row['name'] ?? ''}'.trim(),
      };
    } on DioException {
      return const {};
    }
  }
}

final dashboardRepositoryProvider = Provider<DashboardRepository>(
  (ref) => DashboardRepository(ref.watch(dioProvider)),
);
