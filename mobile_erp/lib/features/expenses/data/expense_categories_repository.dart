import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../core/dio_provider.dart';
import 'expense_models.dart';

/// The only place that talks to `/expense-categories`. Online-only writes.
class ExpenseCategoriesRepository {
  ExpenseCategoriesRepository(this._dio);
  final Dio _dio;

  Future<List<ExpenseCategory>> list() => runApi(() async {
        final res = await _dio.get<List<dynamic>>('/expense-categories');
        return [
          for (final row in res.data ?? const [])
            ExpenseCategory.fromJson((row as Map).cast()),
        ];
      });

  Future<void> create({
    required String name,
    String? description,
    int? sortOrder,
  }) =>
      runApi(() async {
        await _dio.post<Map<String, dynamic>>(
          '/expense-categories',
          data: {
            'name': name,
            if (description != null && description.isNotEmpty)
              'description': description,
            'sortOrder': ?sortOrder,
          },
        );
      });

  Future<void> update(
    String id, {
    String? name,
    String? description,
    int? sortOrder,
    bool? isActive,
  }) =>
      runApi(() async {
        await _dio.patch<Map<String, dynamic>>(
          '/expense-categories/$id',
          data: {
            'name': ?name,
            'description': ?description,
            'sortOrder': ?sortOrder,
            'isActive': ?isActive,
          },
        );
      });
}

final expenseCategoriesRepositoryProvider =
    Provider<ExpenseCategoriesRepository>(
  (ref) => ExpenseCategoriesRepository(ref.watch(dioProvider)),
);
