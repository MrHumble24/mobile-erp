import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/stock_alert.dart';
import '../data/stock_alert_repository.dart';

/// Low-stock rows (count < threshold surfaced first). Also feeds the metrics bar.
final lowStockProvider = FutureProvider<List<LowStockView>>(
  (ref) => ref.watch(stockAlertRepositoryProvider).lowStock(),
);

/// All configured alert rules.
final stockAlertRulesProvider = FutureProvider<List<StockAlertRuleView>>(
  (ref) => ref.watch(stockAlertRepositoryProvider).list(),
);
