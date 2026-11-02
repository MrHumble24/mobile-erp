/// Customer domain models. `/customers` has no offline feed — all reads are
/// online. There is no `customers` i18n namespace; UI uses `sales`/`common`.
library;

DateTime? _date(Object? v) => v == null ? null : DateTime.tryParse('$v');

class Customer {
  const Customer({
    required this.id,
    required this.name,
    this.phone,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? phone;
  final String? notes;
  final DateTime? createdAt;

  factory Customer.fromJson(Map<String, dynamic> j) => Customer(
        id: '${j['id']}',
        name: '${j['name'] ?? ''}',
        phone: j['phone'] as String?,
        notes: j['notes'] as String?,
        createdAt: _date(j['createdAt']),
      );
}

/// One row of a customer's purchase history (`GET /customers/:id/sales` returns
/// full sale views; this slice only needs these display fields). Kept separate
/// from the sales slice's `SaleView` so the two slices stay independent.
class CustomerSale {
  const CustomerSale({
    required this.id,
    required this.imei,
    required this.modelLabel,
    required this.salePrice,
    this.soldAt,
  });

  final String id;
  final String imei;
  final String modelLabel;
  final String salePrice;
  final DateTime? soldAt;

  factory CustomerSale.fromJson(Map<String, dynamic> j) {
    final device = (j['device'] as Map?)?.cast<String, dynamic>() ?? const {};
    final model = (device['model'] as Map?)?.cast<String, dynamic>() ?? const {};
    return CustomerSale(
      id: '${j['id']}',
      imei: '${device['imei'] ?? ''}',
      modelLabel: '${model['brand'] ?? ''} ${model['name'] ?? ''}'.trim(),
      salePrice: '${j['salePrice'] ?? '0'}',
      soldAt: _date(j['soldAt']),
    );
  }
}
