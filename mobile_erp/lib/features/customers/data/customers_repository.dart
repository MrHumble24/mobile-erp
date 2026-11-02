import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'customer_models.dart';

/// The only place that talks to `/customers/*`. All online (no offline feed).
class CustomersRepository {
  CustomersRepository(this._dio);
  final Dio _dio;

  Future<List<Customer>> search(String? query) => runApi(() async {
        final res = await _dio.get<List<dynamic>>(
          '/customers',
          queryParameters: {if (query != null && query.isNotEmpty) 'q': query},
        );
        return (res.data ?? const [])
            .map((e) => Customer.fromJson((e as Map).cast()))
            .toList();
      });

  Future<Customer> create({
    required String name,
    String? phone,
    String? notes,
  }) =>
      runApi(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/customers',
          data: {
            'name': name,
            if (phone != null && phone.isNotEmpty) 'phone': phone,
            if (notes != null && notes.isNotEmpty) 'notes': notes,
          },
        );
        return Customer.fromJson(res.data!);
      });

  Future<List<CustomerSale>> sales(String id) => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/customers/$id/sales');
        return (res.data ?? const [])
            .map((e) => CustomerSale.fromJson((e as Map).cast()))
            .toList();
      });
}

final customersRepositoryProvider = Provider<CustomersRepository>(
  (ref) => CustomersRepository(ref.watch(dioProvider)),
);
