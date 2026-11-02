import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/report_models.dart';
import '../data/reports_repository.dart';

typedef DateRange = ({DateTime? from, DateTime? to});
typedef ExpenseRange = ({DateTime? from, DateTime? to, String groupBy});

final profitReportProvider =
    FutureProvider.autoDispose.family<ProfitReport, DateRange>((ref, r) {
  return ref.watch(reportsRepositoryProvider).profit(from: r.from, to: r.to);
});

final expenseReportProvider = FutureProvider.autoDispose
    .family<List<ExpenseReportRow>, ExpenseRange>((ref, r) {
  return ref
      .watch(reportsRepositoryProvider)
      .expenses(from: r.from, to: r.to, groupBy: r.groupBy);
});

final modelPricingProvider =
    FutureProvider.autoDispose<List<ModelPricingRow>>((ref) {
  return ref.watch(reportsRepositoryProvider).modelPricing();
});

final dailyClosingProvider =
    FutureProvider.autoDispose.family<DailyClosingReport, DateTime>((ref, date) {
  return ref.watch(reportsRepositoryProvider).dailyClosing(date: date);
});

/// Model id → label, shared by the pricing tab and the dashboard-style tables.
final deviceModelLabelsProvider =
    FutureProvider<Map<String, String>>((ref) {
  return ref.watch(reportsRepositoryProvider).deviceModelLabels();
});
