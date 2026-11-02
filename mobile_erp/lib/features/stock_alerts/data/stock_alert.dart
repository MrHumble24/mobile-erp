// Stock-alert rule domain models. Mirrors the server views: a rule caps a
// (model, storage) pair at a minimum threshold; low-stock carries the live count.

class StockAlertRuleView {
  const StockAlertRuleView({
    required this.id,
    required this.modelId,
    required this.storage,
    required this.threshold,
  });

  final String id;
  final String modelId;
  final String storage;
  final int threshold;

  factory StockAlertRuleView.fromJson(Map<String, dynamic> json) =>
      StockAlertRuleView(
        id: json['id'] as String,
        modelId: json['modelId'] as String,
        storage: json['storage'] as String,
        threshold: (json['threshold'] as num).toInt(),
      );
}

class LowStockView {
  const LowStockView({
    required this.id,
    required this.modelId,
    required this.storage,
    required this.threshold,
    required this.currentCount,
  });

  final String id;
  final String modelId;
  final String storage;
  final int threshold;
  final int currentCount;

  bool get isBelow => currentCount < threshold;

  factory LowStockView.fromJson(Map<String, dynamic> json) => LowStockView(
        id: json['id'] as String,
        modelId: json['modelId'] as String,
        storage: json['storage'] as String,
        threshold: (json['threshold'] as num).toInt(),
        currentCount: (json['currentCount'] as num?)?.toInt() ?? 0,
      );
}
