import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'sale_models.dart';
import 'sales_views.dart';

/// Filters for the sales list. `channel` is sent to the server, which derives
/// it from `consignmentId`.
class SaleFilters {
  const SaleFilters({this.from, this.to, this.channel});
  final DateTime? from;
  final DateTime? to;
  final SaleChannel? channel;

  Map<String, dynamic> toQuery() => {
        if (from != null) 'from': from!.toIso8601String(),
        if (to != null) 'to': to!.toIso8601String(),
        if (channel != null) 'channel': channel == SaleChannel.b2b ? 'b2b' : 'retail',
      };
}

class SalesPage {
  const SalesPage({required this.items, required this.total});
  final List<SaleView> items;
  final int total;
}

/// The only place that talks to `/sales/*` reads and the return write.
class SalesRepository {
  SalesRepository(this._dio);
  final Dio _dio;

  Future<SalesPage> list(SaleFilters filters, {int page = 1, int pageSize = 50}) =>
      runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/sales',
          queryParameters: {...filters.toQuery(), 'page': page, 'pageSize': pageSize},
        );
        final data = res.data ?? const {};
        return SalesPage(
          items: (data['items'] as List? ?? const [])
              .map((e) => SaleView.fromJson((e as Map).cast()))
              .toList(),
          total: (data['total'] as num?)?.toInt() ?? 0,
        );
      });

  Future<SaleView> get(String id) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/sales/$id');
        return SaleView.fromJson(res.data!);
      });

  Future<WarrantyLookup> warranty(String imei) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/sales/warranty/$imei');
        return WarrantyLookup.fromJson(res.data!);
      });

  Future<ReceiptView> receipt(String id) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>('/sales/$id/receipt');
        return ReceiptView.fromJson(res.data!);
      });

  Future<SaleView> processReturn(
    String id, {
    required double refundAmount,
    required String deviceToStatusCode,
    String? reason,
    int? expectedVersion,
  }) =>
      runApi(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/sales/$id/return',
          data: {
            'refundAmount': refundAmount,
            'deviceToStatusCode': deviceToStatusCode,
            if (reason != null && reason.isNotEmpty) 'reason': reason,
            'expectedVersion': ?expectedVersion,
          },
        );
        return SaleView.fromJson(res.data!);
      });
}

final salesRepositoryProvider = Provider<SalesRepository>(
  (ref) => SalesRepository(ref.watch(dioProvider)),
);
