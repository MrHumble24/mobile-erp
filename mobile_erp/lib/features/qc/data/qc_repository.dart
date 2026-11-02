import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'qc_models.dart';

/// The only place that talks to `/qc/*` (and `/devices/by-imei` for grading).
/// Read perms: `qc.read`; inspection create: `qc.create`; lookup writes:
/// `settings.manage` (enforced server-side).
class QcRepository {
  QcRepository(this._dio);
  final Dio _dio;

  Future<void> createInspection(Map<String, dynamic> body) => runApi(() async {
        await _dio.post<Map<String, dynamic>>('/qc/inspections', data: body);
      });

  Future<PaginatedInspections> listInspections(
    Map<String, dynamic> filters,
  ) =>
      runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/qc/inspections',
          queryParameters: filters,
        );
        return PaginatedInspections.fromJson(res.data!);
      });

  Future<QcStats> stats({String? from, String? to}) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/qc/stats',
          queryParameters: {
            'from': ?from,
            'to': ?to,
          },
        );
        return QcStats.fromJson(res.data!);
      });

  Future<QcDeviceDetail> deviceByImei(String imei) => runApi(() async {
        final res =
            await _dio.get<Map<String, dynamic>>('/devices/by-imei/$imei');
        return QcDeviceDetail.fromJson(res.data!);
      });

  Future<List<Lookup>> listLookups(String kind, bool includeInactive) =>
      runApi(() async {
        final res = await _dio.get<List<dynamic>>(
          '/qc/$kind',
          queryParameters: {if (includeInactive) 'includeInactive': 'true'},
        );
        return (res.data ?? [])
            .map((e) => Lookup.fromJson((e as Map).cast()))
            .toList();
      });

  Future<void> createLookup(String kind, Map<String, dynamic> body) =>
      runApi(() async {
        await _dio.post<Map<String, dynamic>>('/qc/$kind', data: body);
      });

  Future<void> updateLookup(
    String kind,
    String code,
    Map<String, dynamic> body,
  ) =>
      runApi(() async {
        await _dio.patch<Map<String, dynamic>>('/qc/$kind/$code', data: body);
      });
}

final qcRepositoryProvider = Provider<QcRepository>(
  (ref) => QcRepository(ref.watch(dioProvider)),
);
