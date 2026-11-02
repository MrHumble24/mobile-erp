// Domain models for device models + their dynamic spec schema. Mirrors the
// server `AttributeDef` and `DeviceModelView`. One source of truth for the
// attribute shape, reused by the model editor and the device spec editor.

enum AttributeType {
  text,
  number,
  select;

  static AttributeType fromCode(String? code) => switch (code) {
        'number' => AttributeType.number,
        'select' => AttributeType.select,
        _ => AttributeType.text,
      };

  String get code => name;
}

/// One spec field defined on a model (drives the device spec inputs).
class AttributeDef {
  const AttributeDef({
    required this.key,
    required this.label,
    required this.type,
    this.options = const [],
    this.required = false,
    this.sortOrder = 0,
  });

  final String key;
  final String label;
  final AttributeType type;
  final List<String> options;
  final bool required;
  final int sortOrder;

  AttributeDef copyWith({
    String? key,
    String? label,
    AttributeType? type,
    List<String>? options,
    bool? required,
    int? sortOrder,
  }) =>
      AttributeDef(
        key: key ?? this.key,
        label: label ?? this.label,
        type: type ?? this.type,
        options: options ?? this.options,
        required: required ?? this.required,
        sortOrder: sortOrder ?? this.sortOrder,
      );

  factory AttributeDef.fromJson(Map<String, dynamic> json) => AttributeDef(
        key: json['key'] as String,
        label: json['label'] as String,
        type: AttributeType.fromCode(json['type'] as String?),
        options: (json['options'] as List? ?? const [])
            .map((e) => '$e')
            .toList(),
        required: json['required'] as bool? ?? false,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'key': key,
        'label': label,
        'type': type.code,
        if (type == AttributeType.select) 'options': options,
        'required': required,
        'sortOrder': sortOrder,
      };
}

class DeviceModelView {
  const DeviceModelView({
    required this.id,
    required this.brand,
    required this.name,
    required this.isActive,
    required this.attributes,
  });

  final String id;
  final String brand;
  final String name;
  final bool isActive;
  final List<AttributeDef> attributes;

  String get label => '$brand $name';

  factory DeviceModelView.fromJson(Map<String, dynamic> json) => DeviceModelView(
        id: json['id'] as String,
        brand: json['brand'] as String,
        name: json['name'] as String,
        isActive: json['isActive'] as bool? ?? true,
        attributes: (json['attributes'] as List? ?? const [])
            .map((e) => AttributeDef.fromJson((e as Map).cast()))
            .toList(),
      );
}
