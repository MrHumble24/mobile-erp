import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'supplier.dart';

/// The only place that talks to `/suppliers`. Reads need `shipment.read`,
/// writes need `shipment.manage` (enforced server-side).
class SuppliersRepository {
  SuppliersRepository(this._dio);
  final Dio _dio;

  Future<List<Supplier>> list() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/suppliers');
        return (res.data ?? [])
            .map((e) => Supplier.fromJson((e as Map).cast()))
            .toList();
      });

  Future<Supplier> create(Map<String, dynamic> body) => runApi(() async {
        final res =
            await _dio.post<Map<String, dynamic>>('/suppliers', data: body);
        return Supplier.fromJson(res.data!);
      });

  Future<Supplier> update(String id, Map<String, dynamic> body) =>
      runApi(() async {
        final res = await _dio.patch<Map<String, dynamic>>(
          '/suppliers/$id',
          data: body,
        );
        return Supplier.fromJson(res.data!);
      });
}

final suppliersRepositoryProvider = Provider<SuppliersRepository>(
  (ref) => SuppliersRepository(ref.watch(dioProvider)),
);

/// All suppliers, ordered by name. Shared by the suppliers tab and the shipment
/// create/edit form's supplier picker.
final suppliersProvider = FutureProvider<List<Supplier>>(
  (ref) => ref.watch(suppliersRepositoryProvider).list(),
);
