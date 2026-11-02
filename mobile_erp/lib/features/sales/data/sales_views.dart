/// Read-only projections returned by the warranty-lookup and receipt endpoints.
/// Money stays a Decimal string; dates parse defensively.
library;

DateTime? _date(Object? v) => v == null ? null : DateTime.tryParse('$v');

class WarrantyWindow {
  const WarrantyWindow({required this.days, this.startsAt, this.endsAt});
  final int days;
  final DateTime? startsAt;
  final DateTime? endsAt;

  factory WarrantyWindow.fromJson(Map<String, dynamic> j) => WarrantyWindow(
        days: (j['days'] as num?)?.toInt() ?? 0,
        startsAt: _date(j['startsAt']),
        endsAt: _date(j['endsAt']),
      );
}

/// `GET /sales/warranty/:imei`.
class WarrantyLookup {
  const WarrantyLookup({
    required this.imei,
    required this.saleId,
    required this.salePrice,
    required this.remainingDays,
    required this.alreadyReturned,
    this.purchasedAt,
    this.warranty,
    this.inspectionGrade,
    this.inspectionNotes,
  });

  final String imei;
  final String saleId;
  final DateTime? purchasedAt;
  final String salePrice;
  final WarrantyWindow? warranty;
  final int remainingDays;
  final String? inspectionGrade;
  final String? inspectionNotes;
  final bool alreadyReturned;

  bool get active => warranty != null && remainingDays > 0;

  factory WarrantyLookup.fromJson(Map<String, dynamic> j) {
    final insp = (j['latestInspection'] as Map?)?.cast<String, dynamic>();
    return WarrantyLookup(
      imei: '${j['imei'] ?? ''}',
      saleId: '${j['saleId'] ?? ''}',
      purchasedAt: _date(j['purchasedAt']),
      salePrice: '${j['salePrice'] ?? '0'}',
      warranty: j['warranty'] == null
          ? null
          : WarrantyWindow.fromJson((j['warranty'] as Map).cast()),
      remainingDays: (j['remainingDays'] as num?)?.toInt() ?? 0,
      inspectionGrade: insp?['grade'] as String?,
      inspectionNotes: insp?['notes'] as String?,
      alreadyReturned: j['alreadyReturned'] == true,
    );
  }
}

class ReceiptItem {
  const ReceiptItem({
    required this.imei,
    required this.model,
    required this.price,
    this.storage,
    this.color,
  });
  final String imei;
  final String model;
  final String? storage;
  final String? color;
  final String price;

  factory ReceiptItem.fromJson(Map<String, dynamic> j) => ReceiptItem(
        imei: '${j['imei'] ?? ''}',
        model: '${j['model'] ?? ''}',
        storage: j['storage'] as String?,
        color: j['color'] as String?,
        price: '${j['price'] ?? '0'}',
      );
}

/// `GET /sales/:id/receipt` — never carries cost/profit.
class ReceiptView {
  const ReceiptView({
    required this.saleId,
    required this.cashier,
    required this.items,
    required this.total,
    this.soldAt,
    this.warrantyDays,
    this.warrantyEndsAt,
    this.customerName,
    this.customerPhone,
  });

  final String saleId;
  final DateTime? soldAt;
  final String cashier;
  final List<ReceiptItem> items;
  final String total;
  final int? warrantyDays;
  final DateTime? warrantyEndsAt;
  final String? customerName;
  final String? customerPhone;

  factory ReceiptView.fromJson(Map<String, dynamic> j) {
    final w = (j['warranty'] as Map?)?.cast<String, dynamic>();
    final c = (j['customer'] as Map?)?.cast<String, dynamic>();
    return ReceiptView(
      saleId: '${j['saleId'] ?? ''}',
      soldAt: _date(j['soldAt']),
      cashier: '${j['cashier'] ?? ''}',
      items: (j['items'] as List? ?? const [])
          .map((e) => ReceiptItem.fromJson((e as Map).cast()))
          .toList(),
      total: '${j['total'] ?? '0'}',
      warrantyDays: (w?['days'] as num?)?.toInt(),
      warrantyEndsAt: _date(w?['endsAt']),
      customerName: c?['name'] as String?,
      customerPhone: c?['phone'] as String?,
    );
  }
}
