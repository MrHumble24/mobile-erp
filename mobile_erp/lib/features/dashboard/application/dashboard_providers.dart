import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/dashboard_models.dart';
import '../data/dashboard_repository.dart';

/// KPI period toggle on the dashboard.
enum DashPeriod { today, week, month }

({DateTime from, DateTime to}) periodRange(DashPeriod period) {
  final now = DateTime.now();
  final from = switch (period) {
    DashPeriod.today => DateTime(now.year, now.month, now.day),
    DashPeriod.week => now.subtract(Duration(days: now.weekday - 1)).dateOnly,
    DashPeriod.month => DateTime(now.year, now.month, 1),
  };
  return (from: from, to: now);
}

extension on DateTime {
  DateTime get dateOnly => DateTime(year, month, day);
}

final dashProfitProvider =
    FutureProvider.autoDispose.family<DashProfit, DashPeriod>((ref, period) {
  final range = periodRange(period);
  return ref
      .watch(dashboardRepositoryProvider)
      .profit(from: range.from, to: range.to);
});

final dashModelPricingProvider =
    FutureProvider.autoDispose<List<DashModelPricingRow>>((ref) {
  return ref.watch(dashboardRepositoryProvider).modelPricing();
});

final dashLowStockProvider =
    FutureProvider.autoDispose<List<LowStockItem>>((ref) {
  return ref.watch(dashboardRepositoryProvider).lowStock();
});

final dashOverdueProvider =
    FutureProvider.autoDispose<List<OverdueConsignment>>((ref) {
  return ref.watch(dashboardRepositoryProvider).overdue();
});

final dashModelLabelsProvider = FutureProvider<Map<String, String>>((ref) {
  return ref.watch(dashboardRepositoryProvider).deviceModelLabels();
});
