/// Domain models for a completed sale as returned by `/sales`.
///
/// Money arrives as Decimal strings; keep it as `String` and format with the
/// shared `formatMoney`. Cost fields (`landedCostSnapshot`, `netProfit`) are
/// redacted for under-privileged users — the server OMITS them, so they are
/// nullable here (never assume a value).
library;

String? _money(Object? v) => v?.toString();

DateTime? _date(Object? v) => v == null ? null : DateTime.tryParse('$v');

class SaleModelRef {
  const SaleModelRef({required this.brand, required this.name});
  final String brand;
  final String name;
  String get label => '$brand $name';

  factory SaleModelRef.fromJson(Map<String, dynamic> j) =>
      SaleModelRef(brand: '${j['brand'] ?? ''}', name: '${j['name'] ?? ''}');
}

class SaleDevice {
  const SaleDevice({required this.imei, required this.model, this.specs});
  final String imei;
  final SaleModelRef model;
  final Map<String, dynamic>? specs;

  factory SaleDevice.fromJson(Map<String, dynamic> j) => SaleDevice(
        imei: '${j['imei'] ?? ''}',
        model: SaleModelRef.fromJson((j['model'] as Map?)?.cast() ?? const {}),
        specs: (j['specs'] as Map?)?.cast<String, dynamic>(),
      );
}

class SaleCustomer {
  const SaleCustomer({required this.id, required this.name, this.phone});
  final String id;
  final String name;
  final String? phone;

  factory SaleCustomer.fromJson(Map<String, dynamic> j) => SaleCustomer(
        id: '${j['id']}',
        name: '${j['name'] ?? ''}',
        phone: j['phone'] as String?,
      );
}

class SalePerson {
  const SalePerson({required this.id, required this.name});
  final String id;
  final String name;

  factory SalePerson.fromJson(Map<String, dynamic> j) =>
      SalePerson(id: '${j['id']}', name: '${j['name'] ?? ''}');
}

class SaleWarranty {
  const SaleWarranty({required this.days, this.startsAt, this.endsAt});
  final int days;
  final DateTime? startsAt;
  final DateTime? endsAt;

  factory SaleWarranty.fromJson(Map<String, dynamic> j) => SaleWarranty(
        days: (j['days'] as num?)?.toInt() ?? 0,
        startsAt: _date(j['startsAt']),
        endsAt: _date(j['endsAt']),
      );
}

/// A sale channel is DERIVED from `consignmentId` (a consignment sale is B2B),
/// never a stored column — mirrors the server/DB rule.
enum SaleChannel { retail, b2b }

class SaleView {
  const SaleView({
    required this.id,
    required this.device,
    required this.salePrice,
    required this.soldAt,
    required this.soldBy,
    this.customer,
    this.landedCostSnapshot,
    this.netProfit,
    this.warranty,
    this.consignmentId,
  });

  final String id;
  final SaleDevice device;
  final SaleCustomer? customer;
  final String salePrice;
  final String? landedCostSnapshot;
  final String? netProfit;
  final DateTime? soldAt;
  final SalePerson soldBy;
  final SaleWarranty? warranty;
  final String? consignmentId;

  SaleChannel get channel =>
      consignmentId != null ? SaleChannel.b2b : SaleChannel.retail;

  factory SaleView.fromJson(Map<String, dynamic> j) => SaleView(
        id: '${j['id']}',
        device: SaleDevice.fromJson((j['device'] as Map?)?.cast() ?? const {}),
        customer: j['customer'] == null
            ? null
            : SaleCustomer.fromJson((j['customer'] as Map).cast()),
        salePrice: _money(j['salePrice']) ?? '0',
        landedCostSnapshot: _money(j['landedCostSnapshot']),
        netProfit: _money(j['netProfit']),
        soldAt: _date(j['soldAt']),
        soldBy: SalePerson.fromJson((j['soldBy'] as Map?)?.cast() ?? const {}),
        warranty: j['warranty'] == null
            ? null
            : SaleWarranty.fromJson((j['warranty'] as Map).cast()),
        consignmentId: j['consignmentId'] as String?,
      );
}
