import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'expense_models.dart';

/// The only place that talks to `/expenses`. Online-only writes — callers gate
/// on connectivity before create/delete (no offline queue for expenses).
class ExpensesRepository {
  ExpensesRepository(this._dio);
  final Dio _dio;

  Future<ExpensePage> list(ExpenseFilter filter) => runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/expenses',
          queryParameters: {
            'categoryId': ?filter.categoryId,
            'isRecurring': ?filter.isRecurring,
            'page': 1,
            'pageSize': 100,
          },
        );
        return ExpensePage.fromJson(res.data!);
      });

  Future<ExpenseSummary> summary({DateTime? from, DateTime? to}) =>
      runApi(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/expenses/summary',
          queryParameters: {
            if (from != null) 'from': from.toIso8601String(),
            if (to != null) 'to': to.toIso8601String(),
          },
        );
        return ExpenseSummary.fromJson(res.data!);
      });

  Future<void> create({
    required String categoryId,
    required num amount,
    String? description,
    bool isRecurring = false,
    DateTime? incurredAt,
  }) =>
      runApi(() async {
        await _dio.post<Map<String, dynamic>>(
          '/expenses',
          data: {
            'categoryId': categoryId,
            'amount': amount,
            if (description != null && description.isNotEmpty)
              'description': description,
            'isRecurring': isRecurring,
            if (incurredAt != null) 'incurredAt': incurredAt.toIso8601String(),
          },
        );
      });

  Future<void> remove(String id) =>
      runApi(() => _dio.delete<void>('/expenses/$id'));
}

final expensesRepositoryProvider = Provider<ExpensesRepository>(
  (ref) => ExpensesRepository(ref.watch(dioProvider)),
);
