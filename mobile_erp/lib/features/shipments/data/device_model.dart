/// One spec field defined on a device model (mirrors server `AttributeDef`).
class AttributeDef {
  const AttributeDef({
    required this.key,
    required this.label,
    required this.type,
    required this.options,
    required this.required,
  });

  final String key;
  final String label;

  /// `text` | `number` | `select`.
  final String type;
  final List<String> options;
  final bool required;

  factory AttributeDef.fromJson(Map<String, dynamic> json) => AttributeDef(
        key: json['key'] as String,
        label: json['label'] as String,
        type: json['type'] as String,
        options: (json['options'] as List? ?? const [])
            .map((e) => '$e')
            .toList(),
        required: (json['required'] as bool?) ?? false,
      );
}

/// A catalog model (brand + name) carrying its spec schema. Mirrors
/// `DeviceModelView`. Shared by shipment intake and the QC queue (name map).
class DeviceModel {
  const DeviceModel({
    required this.id,
    required this.brand,
    required this.name,
    required this.attributes,
  });

  final String id;
  final String brand;
  final String name;
  final List<AttributeDef> attributes;

  String get label => '$brand $name';

  factory DeviceModel.fromJson(Map<String, dynamic> json) => DeviceModel(
        id: json['id'] as String,
        brand: json['brand'] as String,
        name: json['name'] as String,
        attributes: (json['attributes'] as List? ?? const [])
            .map((e) => AttributeDef.fromJson((e as Map).cast()))
            .toList(),
      );
}
