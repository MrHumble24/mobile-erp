import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sale_models.dart';
import '../data/sales_repository.dart';
import '../data/sales_views.dart';

/// Client-only filter state for the sales list (channel + date range).
class SalesFilterController extends Notifier<SaleFilters> {
  @override
  SaleFilters build() => const SaleFilters();

  void setChannel(SaleChannel? channel) =>
      state = SaleFilters(from: state.from, to: state.to, channel: channel);
  void setRange(DateTime? from, DateTime? to) =>
      state = SaleFilters(from: from, to: to, channel: state.channel);
  void clear() => state = const SaleFilters();
}

final salesFilterProvider =
    NotifierProvider<SalesFilterController, SaleFilters>(SalesFilterController.new);

/// The sales list for the active filters (online read; not in the offline feed).
final salesListProvider = FutureProvider.autoDispose<SalesPage>((ref) {
  final filters = ref.watch(salesFilterProvider);
  return ref.watch(salesRepositoryProvider).list(filters);
});

/// One sale's printable receipt, fetched on demand.
final receiptProvider =
    FutureProvider.autoDispose.family<ReceiptView, String>((ref, saleId) {
  return ref.watch(salesRepositoryProvider).receipt(saleId);
});
