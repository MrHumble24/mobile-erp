import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'report_models.dart';

/// The only place that talks to `/reports/*` (perm `report.finance`) plus a
/// best-effort `/device-models` read to label pricing rows. All online reads.
class ReportsRepository {
  ReportsRepository(this._dio);
  final Dio _dio;

  Future<ProfitReport> profit({DateTime? from, DateTime? to}) =>
      runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/reports/profit',
          queryParameters: _range(from, to),
        );
        return ProfitReport.fromJson(res.data!);
      });

  Future<List<ExpenseReportRow>> expenses({
    DateTime? from,
    DateTime? to,
    String groupBy = 'category',
  }) =>
      runApi(() async {
        final res = await _dio.get<List<dynamic>>(
          '/reports/expenses',
          queryParameters: {..._range(from, to), 'groupBy': groupBy},
        );
        return [
          for (final row in res.data ?? const [])
            ExpenseReportRow.fromJson((row as Map).cast()),
        ];
      });

  Future<List<ModelPricingRow>> modelPricing({int windowDays = 90}) =>
      runApi(() async {
        final res = await _dio.get<List<dynamic>>(
          '/reports/model-pricing',
          queryParameters: {'windowDays': windowDays},
        );
        return [
          for (final row in res.data ?? const [])
            ModelPricingRow.fromJson((row as Map).cast()),
        ];
      });

  Future<DailyClosingReport> dailyClosing({DateTime? date}) =>
      runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/reports/daily-closing',
          queryParameters: {
            if (date != null) 'date': date.toIso8601String(),
          },
        );
        return DailyClosingReport.fromJson(res.data!);
      });

  /// Model id → readable label. Returns an empty map if the user may not read
  /// device models — pricing rows then fall back to the raw id.
  Future<Map<String, String>> deviceModelLabels() async {
    try {
      final res = await _dio.get<List<dynamic>>('/device-models');
      return {
        for (final row in res.data ?? const [])
          (row as Map)['id'] as String:
              DeviceModelRef.fromJson(row.cast()).label,
      };
    } on DioException {
      return const {};
    }
  }

  Map<String, dynamic> _range(DateTime? from, DateTime? to) => {
        if (from != null) 'from': from.toIso8601String(),
        if (to != null) 'to': to.toIso8601String(),
      };
}

final reportsRepositoryProvider = Provider<ReportsRepository>(
  (ref) => ReportsRepository(ref.watch(dioProvider)),
);
