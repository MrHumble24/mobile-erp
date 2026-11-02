import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'consignment_models.dart';

/// The only place that talks to `/consignments/*`. Reads are online; the three
/// writes (create/settle/return) are offline-capable — the ConsignmentWriter
/// decides REST-now vs outbox and calls these only on the online path.
class ConsignmentRepository {
  ConsignmentRepository(this._dio);
  final Dio _dio;

  Future<ConsignmentPage> list({String? statusCode}) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/consignments',
          queryParameters: {'statusCode': ?statusCode},
        );
        return ConsignmentPage.fromJson(res.data!);
      });

  Future<List<ConsignmentView>> overdue() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/consignments/overdue');
        return (res.data ?? const [])
            .map((e) => ConsignmentView.fromJson((e as Map).cast()))
            .toList();
      });

  Future<void> create(Map<String, dynamic> body) => runApi(() async {
        await _dio.post<Map<String, dynamic>>('/consignments', data: body);
      });

  Future<void> settle(String id, Map<String, dynamic> body) => runApi(() async {
        await _dio.post<Map<String, dynamic>>('/consignments/$id/settle', data: body);
      });

  Future<void> returnToStock(String id, Map<String, dynamic> body) =>
      runApi(() async {
        await _dio.post<Map<String, dynamic>>('/consignments/$id/return', data: body);
      });
}

final consignmentRepositoryProvider = Provider<ConsignmentRepository>(
  (ref) => ConsignmentRepository(ref.watch(dioProvider)),
);
