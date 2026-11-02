// Report aggregates. All numbers come pre-computed from the server; cost-based
// fields (`avgAcquisitionCost`) are nullable — absent/redacted for users
// without cost visibility.

class ProfitReport {
  const ProfitReport({
    required this.revenue,
    required this.cogs,
    required this.unitsSold,
    required this.grossProfit,
    required this.expenses,
    required this.netOperatingIncome,
    required this.retail,
    required this.b2b,
    required this.returnsRefunded,
  });

  final num revenue;
  final num cogs;
  final int unitsSold;
  final num grossProfit;
  final num expenses;
  final num netOperatingIncome;
  final num retail;
  final num b2b;
  final num returnsRefunded;

  factory ProfitReport.fromJson(Map<String, dynamic> json) {
    final channel = (json['byChannel'] as Map?)?.cast<String, dynamic>();
    return ProfitReport(
      revenue: (json['revenue'] as num?) ?? 0,
      cogs: (json['cogs'] as num?) ?? 0,
      unitsSold: (json['unitsSold'] as num?)?.toInt() ?? 0,
      grossProfit: (json['grossProfit'] as num?) ?? 0,
      expenses: (json['expenses'] as num?) ?? 0,
      netOperatingIncome: (json['netOperatingIncome'] as num?) ?? 0,
      retail: (channel?['retail'] as num?) ?? 0,
      b2b: (channel?['b2b'] as num?) ?? 0,
      returnsRefunded: (json['returnsRefunded'] as num?) ?? 0,
    );
  }
}

class ExpenseReportRow {
  const ExpenseReportRow({
    required this.key,
    required this.label,
    required this.total,
  });

  final String key;
  final String label;
  final num total;

  factory ExpenseReportRow.fromJson(Map<String, dynamic> json) =>
      ExpenseReportRow(
        key: json['key']?.toString() ?? '',
        label: json['label']?.toString() ?? '',
        total: (json['total'] as num?) ?? 0,
      );
}

class ModelPricingRow {
  const ModelPricingRow({
    required this.modelId,
    required this.storage,
    required this.avgAcquisitionCost,
    required this.avgSellingPrice,
    required this.unitsInStock,
    required this.unitsSold,
  });

  final String modelId;
  final String? storage;

  /// Cost field — null when redacted for the current user.
  final num? avgAcquisitionCost;
  final num? avgSellingPrice;
  final int unitsInStock;
  final int unitsSold;

  factory ModelPricingRow.fromJson(Map<String, dynamic> json) => ModelPricingRow(
        modelId: json['modelId'] as String,
        storage: json['storage'] as String?,
        avgAcquisitionCost: json['avgAcquisitionCost'] as num?,
        avgSellingPrice: json['avgSellingPrice'] as num?,
        unitsInStock: (json['unitsInStock'] as num?)?.toInt() ?? 0,
        unitsSold: (json['unitsSold'] as num?)?.toInt() ?? 0,
      );
}

class DailyClosingReport {
  const DailyClosingReport({
    required this.date,
    required this.unitsSold,
    required this.revenue,
    required this.grossProfit,
    required this.expenses,
    required this.newConsignments,
    required this.settledConsignments,
  });

  final String date;
  final int unitsSold;
  final num revenue;
  final num grossProfit;
  final num expenses;
  final int newConsignments;
  final int settledConsignments;

  factory DailyClosingReport.fromJson(Map<String, dynamic> json) =>
      DailyClosingReport(
        date: json['date']?.toString() ?? '',
        unitsSold: (json['unitsSold'] as num?)?.toInt() ?? 0,
        revenue: (json['revenue'] as num?) ?? 0,
        grossProfit: (json['grossProfit'] as num?) ?? 0,
        expenses: (json['expenses'] as num?) ?? 0,
        newConsignments: (json['newConsignments'] as num?)?.toInt() ?? 0,
        settledConsignments:
            (json['settledConsignments'] as num?)?.toInt() ?? 0,
      );
}

/// Minimal device-model reference used to label `modelId` in pricing rows.
/// (The reports slice owns its own DTO — it may not reach into another slice.)
class DeviceModelRef {
  const DeviceModelRef({required this.id, required this.label});

  final String id;
  final String label;

  factory DeviceModelRef.fromJson(Map<String, dynamic> json) => DeviceModelRef(
        id: json['id'] as String,
        label: '${json['brand'] ?? ''} ${json['name'] ?? ''}'.trim(),
      );
}
