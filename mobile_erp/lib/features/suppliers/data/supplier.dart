/// A supplier of device shipments. Mirrors the server `SupplierView`.
class Supplier {
  const Supplier({
    required this.id,
    required this.name,
    required this.isActive,
    this.country,
    this.contact,
    this.notes,
  });

  final String id;
  final String name;
  final String? country;
  final String? contact;
  final String? notes;
  final bool isActive;

  factory Supplier.fromJson(Map<String, dynamic> json) => Supplier(
        id: json['id'] as String,
        name: json['name'] as String,
        country: json['country'] as String?,
        contact: json['contact'] as String?,
        notes: json['notes'] as String?,
        isActive: (json['isActive'] as bool?) ?? true,
      );
}
