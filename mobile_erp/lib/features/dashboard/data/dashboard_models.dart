// Dashboard DTOs. The slice owns its own shapes (it may not import another
// slice); `DashProfit`/`DashModelPricingRow` deliberately mirror the reports
// slice — see the slice README for the shared-contract note.

class DashProfit {
  const DashProfit({
    required this.revenue,
    required this.grossProfit,
    required this.expenses,
    required this.netOperatingIncome,
    required this.unitsSold,
    required this.retail,
    required this.b2b,
    required this.returnsRefunded,
  });

  final num revenue;
  final num grossProfit;
  final num expenses;
  final num netOperatingIncome;
  final int unitsSold;
  final num retail;
  final num b2b;
  final num returnsRefunded;

  factory DashProfit.fromJson(Map<String, dynamic> json) {
    final channel = (json['byChannel'] as Map?)?.cast<String, dynamic>();
    return DashProfit(
      revenue: (json['revenue'] as num?) ?? 0,
      grossProfit: (json['grossProfit'] as num?) ?? 0,
      expenses: (json['expenses'] as num?) ?? 0,
      netOperatingIncome: (json['netOperatingIncome'] as num?) ?? 0,
      unitsSold: (json['unitsSold'] as num?)?.toInt() ?? 0,
      retail: (channel?['retail'] as num?) ?? 0,
      b2b: (channel?['b2b'] as num?) ?? 0,
      returnsRefunded: (json['returnsRefunded'] as num?) ?? 0,
    );
  }
}

class DashModelPricingRow {
  const DashModelPricingRow({
    required this.modelId,
    required this.storage,
    required this.avgAcquisitionCost,
    required this.avgSellingPrice,
    required this.unitsInStock,
    required this.unitsSold,
  });

  final String modelId;
  final String? storage;
  final num? avgAcquisitionCost;
  final num? avgSellingPrice;
  final int unitsInStock;
  final int unitsSold;

  factory DashModelPricingRow.fromJson(Map<String, dynamic> json) =>
      DashModelPricingRow(
        modelId: json['modelId'] as String,
        storage: json['storage'] as String?,
        avgAcquisitionCost: json['avgAcquisitionCost'] as num?,
        avgSellingPrice: json['avgSellingPrice'] as num?,
        unitsInStock: (json['unitsInStock'] as num?)?.toInt() ?? 0,
        unitsSold: (json['unitsSold'] as num?)?.toInt() ?? 0,
      );
}

class LowStockItem {
  const LowStockItem({
    required this.id,
    required this.modelId,
    required this.storage,
    required this.currentCount,
    required this.threshold,
  });

  final String id;
  final String modelId;
  final String storage;
  final int currentCount;
  final int threshold;

  factory LowStockItem.fromJson(Map<String, dynamic> json) => LowStockItem(
        id: json['id'] as String,
        modelId: json['modelId'] as String,
        storage: json['storage']?.toString() ?? '',
        currentCount: (json['currentCount'] as num?)?.toInt() ?? 0,
        threshold: (json['threshold'] as num?)?.toInt() ?? 0,
      );
}

class OverdueConsignment {
  const OverdueConsignment({
    required this.id,
    required this.imei,
    required this.agreedPrice,
    required this.dueDate,
    required this.partnerShopName,
    this.partnerPhone,
  });

  final String id;
  final String imei;
  final String agreedPrice;
  final DateTime dueDate;
  final String partnerShopName;
  final String? partnerPhone;

  factory OverdueConsignment.fromJson(Map<String, dynamic> json) =>
      OverdueConsignment(
        id: json['id'] as String,
        imei: json['imei']?.toString() ?? '',
        agreedPrice: json['agreedPrice']?.toString() ?? '0',
        dueDate: DateTime.tryParse(json['dueDate']?.toString() ?? '') ??
            DateTime.now(),
        partnerShopName: json['partnerShopName']?.toString() ?? '',
        partnerPhone: json['partnerPhone'] as String?,
      );
}
