import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/customer_models.dart';
import '../data/customers_repository.dart';

/// Current search text for the customer list (client-only state).
final customerQueryProvider = NotifierProvider<CustomerQuery, String>(
  CustomerQuery.new,
);

class CustomerQuery extends Notifier<String> {
  @override
  String build() => '';
  void set(String q) => state = q;
}

/// Searchable customer list (online). Re-queries as the search text changes.
final customersProvider = FutureProvider.autoDispose<List<Customer>>((ref) {
  final q = ref.watch(customerQueryProvider);
  return ref.watch(customersRepositoryProvider).search(q);
});

/// One customer's purchase history.
final customerSalesProvider =
    FutureProvider.autoDispose.family<List<CustomerSale>, String>((ref, id) {
  return ref.watch(customersRepositoryProvider).sales(id);
});

/// Creates a customer and refreshes the list. State holds the last created
/// customer (or an error) so the dialog can react.
class CustomerCreateController extends AutoDisposeAsyncNotifier<Customer?> {
  @override
  Future<Customer?> build() async => null;

  Future<Customer?> submit({
    required String name,
    String? phone,
    String? notes,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref
        .read(customersRepositoryProvider)
        .create(name: name, phone: phone, notes: notes));
    if (state.hasValue) ref.invalidate(customersProvider);
    return state.valueOrNull;
  }
}

final customerCreateControllerProvider =
    AutoDisposeAsyncNotifierProvider<CustomerCreateController, Customer?>(
  CustomerCreateController.new,
);
