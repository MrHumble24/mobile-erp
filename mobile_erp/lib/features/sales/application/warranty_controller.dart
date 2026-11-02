import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sales_repository.dart';
import '../data/sales_views.dart';

/// Warranty lookup panel state. `null` = nothing looked up yet. Errors surface
/// through the AsyncValue (e.g. 404 → no sale for that IMEI).
class WarrantyController extends AutoDisposeAsyncNotifier<WarrantyLookup?> {
  @override
  Future<WarrantyLookup?> build() async => null;

  Future<void> lookup(String imei) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(salesRepositoryProvider).warranty(imei),
    );
  }

  void clear() => state = const AsyncData(null);
}

final warrantyControllerProvider = AutoDisposeAsyncNotifierProvider<
    WarrantyController, WarrantyLookup?>(WarrantyController.new);
