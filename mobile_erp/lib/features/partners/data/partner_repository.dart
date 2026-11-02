import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'partner_ledger.dart';

/// The only place that talks to `/partners/*`. Reads of the partner directory
/// itself come from the Drift cache (hydrated by `/sync/changes`); this handles
/// the ledger (not in the changes feed) and the two online-only writes.
class PartnerRepository {
  PartnerRepository(this._dio);
  final Dio _dio;

  Future<List<LedgerEntry>> ledger(String partnerId) => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/partners/$partnerId/ledger');
        return (res.data ?? const [])
            .map((e) => LedgerEntry.fromJson((e as Map).cast()))
            .toList();
      });

  /// Online-only (no offline handler). Caller gates on connectivity.
  Future<void> create(Map<String, dynamic> body) => runApi(() async {
        await _dio.post<Map<String, dynamic>>('/partners', data: body);
      });

  Future<void> recordPayment(String partnerId, Map<String, dynamic> body) =>
      runApi(() async {
        await _dio.post<Map<String, dynamic>>(
          '/partners/$partnerId/payments',
          data: body,
        );
      });
}

final partnerRepositoryProvider = Provider<PartnerRepository>(
  (ref) => PartnerRepository(ref.watch(dioProvider)),
);
