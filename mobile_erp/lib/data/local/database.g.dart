// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $DevicesTable extends Devices with TableInfo<$DevicesTable, Device> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DevicesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _imeiMeta = const VerificationMeta('imei');
  @override
  late final GeneratedColumn<String> imei = GeneratedColumn<String>(
    'imei',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusCodeMeta = const VerificationMeta(
    'statusCode',
  );
  @override
  late final GeneratedColumn<String> statusCode = GeneratedColumn<String>(
    'status_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _versionMeta = const VerificationMeta(
    'version',
  );
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
    'version',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _targetPriceMeta = const VerificationMeta(
    'targetPrice',
  );
  @override
  late final GeneratedColumn<String> targetPrice = GeneratedColumn<String>(
    'target_price',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _specsMeta = const VerificationMeta('specs');
  @override
  late final GeneratedColumn<String> specs = GeneratedColumn<String>(
    'specs',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('{}'),
  );
  static const VerificationMeta _modelIdMeta = const VerificationMeta(
    'modelId',
  );
  @override
  late final GeneratedColumn<String> modelId = GeneratedColumn<String>(
    'model_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _modelBrandMeta = const VerificationMeta(
    'modelBrand',
  );
  @override
  late final GeneratedColumn<String> modelBrand = GeneratedColumn<String>(
    'model_brand',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _modelNameMeta = const VerificationMeta(
    'modelName',
  );
  @override
  late final GeneratedColumn<String> modelName = GeneratedColumn<String>(
    'model_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _latestSaleMeta = const VerificationMeta(
    'latestSale',
  );
  @override
  late final GeneratedColumn<String> latestSale = GeneratedColumn<String>(
    'latest_sale',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _gradeCodeMeta = const VerificationMeta(
    'gradeCode',
  );
  @override
  late final GeneratedColumn<String> gradeCode = GeneratedColumn<String>(
    'grade_code',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _inspectionNotesMeta = const VerificationMeta(
    'inspectionNotes',
  );
  @override
  late final GeneratedColumn<String> inspectionNotes = GeneratedColumn<String>(
    'inspection_notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    imei,
    statusCode,
    version,
    targetPrice,
    specs,
    modelId,
    modelBrand,
    modelName,
    latestSale,
    gradeCode,
    inspectionNotes,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'devices';
  @override
  VerificationContext validateIntegrity(
    Insertable<Device> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('imei')) {
      context.handle(
        _imeiMeta,
        imei.isAcceptableOrUnknown(data['imei']!, _imeiMeta),
      );
    } else if (isInserting) {
      context.missing(_imeiMeta);
    }
    if (data.containsKey('status_code')) {
      context.handle(
        _statusCodeMeta,
        statusCode.isAcceptableOrUnknown(data['status_code']!, _statusCodeMeta),
      );
    } else if (isInserting) {
      context.missing(_statusCodeMeta);
    }
    if (data.containsKey('version')) {
      context.handle(
        _versionMeta,
        version.isAcceptableOrUnknown(data['version']!, _versionMeta),
      );
    } else if (isInserting) {
      context.missing(_versionMeta);
    }
    if (data.containsKey('target_price')) {
      context.handle(
        _targetPriceMeta,
        targetPrice.isAcceptableOrUnknown(
          data['target_price']!,
          _targetPriceMeta,
        ),
      );
    }
    if (data.containsKey('specs')) {
      context.handle(
        _specsMeta,
        specs.isAcceptableOrUnknown(data['specs']!, _specsMeta),
      );
    }
    if (data.containsKey('model_id')) {
      context.handle(
        _modelIdMeta,
        modelId.isAcceptableOrUnknown(data['model_id']!, _modelIdMeta),
      );
    } else if (isInserting) {
      context.missing(_modelIdMeta);
    }
    if (data.containsKey('model_brand')) {
      context.handle(
        _modelBrandMeta,
        modelBrand.isAcceptableOrUnknown(data['model_brand']!, _modelBrandMeta),
      );
    } else if (isInserting) {
      context.missing(_modelBrandMeta);
    }
    if (data.containsKey('model_name')) {
      context.handle(
        _modelNameMeta,
        modelName.isAcceptableOrUnknown(data['model_name']!, _modelNameMeta),
      );
    } else if (isInserting) {
      context.missing(_modelNameMeta);
    }
    if (data.containsKey('latest_sale')) {
      context.handle(
        _latestSaleMeta,
        latestSale.isAcceptableOrUnknown(data['latest_sale']!, _latestSaleMeta),
      );
    }
    if (data.containsKey('grade_code')) {
      context.handle(
        _gradeCodeMeta,
        gradeCode.isAcceptableOrUnknown(data['grade_code']!, _gradeCodeMeta),
      );
    }
    if (data.containsKey('inspection_notes')) {
      context.handle(
        _inspectionNotesMeta,
        inspectionNotes.isAcceptableOrUnknown(
          data['inspection_notes']!,
          _inspectionNotesMeta,
        ),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Device map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Device(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      imei: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}imei'],
      )!,
      statusCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status_code'],
      )!,
      version: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}version'],
      )!,
      targetPrice: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}target_price'],
      ),
      specs: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}specs'],
      )!,
      modelId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model_id'],
      )!,
      modelBrand: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model_brand'],
      )!,
      modelName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model_name'],
      )!,
      latestSale: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}latest_sale'],
      ),
      gradeCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}grade_code'],
      ),
      inspectionNotes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}inspection_notes'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $DevicesTable createAlias(String alias) {
    return $DevicesTable(attachedDatabase, alias);
  }
}

class Device extends DataClass implements Insertable<Device> {
  final String id;
  final String imei;
  final String statusCode;
  final int version;
  final String? targetPrice;
  final String specs;
  final String modelId;
  final String modelBrand;
  final String modelName;
  final String? latestSale;
  final String? gradeCode;
  final String? inspectionNotes;
  final String updatedAt;
  const Device({
    required this.id,
    required this.imei,
    required this.statusCode,
    required this.version,
    this.targetPrice,
    required this.specs,
    required this.modelId,
    required this.modelBrand,
    required this.modelName,
    this.latestSale,
    this.gradeCode,
    this.inspectionNotes,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['imei'] = Variable<String>(imei);
    map['status_code'] = Variable<String>(statusCode);
    map['version'] = Variable<int>(version);
    if (!nullToAbsent || targetPrice != null) {
      map['target_price'] = Variable<String>(targetPrice);
    }
    map['specs'] = Variable<String>(specs);
    map['model_id'] = Variable<String>(modelId);
    map['model_brand'] = Variable<String>(modelBrand);
    map['model_name'] = Variable<String>(modelName);
    if (!nullToAbsent || latestSale != null) {
      map['latest_sale'] = Variable<String>(latestSale);
    }
    if (!nullToAbsent || gradeCode != null) {
      map['grade_code'] = Variable<String>(gradeCode);
    }
    if (!nullToAbsent || inspectionNotes != null) {
      map['inspection_notes'] = Variable<String>(inspectionNotes);
    }
    map['updated_at'] = Variable<String>(updatedAt);
    return map;
  }

  DevicesCompanion toCompanion(bool nullToAbsent) {
    return DevicesCompanion(
      id: Value(id),
      imei: Value(imei),
      statusCode: Value(statusCode),
      version: Value(version),
      targetPrice: targetPrice == null && nullToAbsent
          ? const Value.absent()
          : Value(targetPrice),
      specs: Value(specs),
      modelId: Value(modelId),
      modelBrand: Value(modelBrand),
      modelName: Value(modelName),
      latestSale: latestSale == null && nullToAbsent
          ? const Value.absent()
          : Value(latestSale),
      gradeCode: gradeCode == null && nullToAbsent
          ? const Value.absent()
          : Value(gradeCode),
      inspectionNotes: inspectionNotes == null && nullToAbsent
          ? const Value.absent()
          : Value(inspectionNotes),
      updatedAt: Value(updatedAt),
    );
  }

  factory Device.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Device(
      id: serializer.fromJson<String>(json['id']),
      imei: serializer.fromJson<String>(json['imei']),
      statusCode: serializer.fromJson<String>(json['statusCode']),
      version: serializer.fromJson<int>(json['version']),
      targetPrice: serializer.fromJson<String?>(json['targetPrice']),
      specs: serializer.fromJson<String>(json['specs']),
      modelId: serializer.fromJson<String>(json['modelId']),
      modelBrand: serializer.fromJson<String>(json['modelBrand']),
      modelName: serializer.fromJson<String>(json['modelName']),
      latestSale: serializer.fromJson<String?>(json['latestSale']),
      gradeCode: serializer.fromJson<String?>(json['gradeCode']),
      inspectionNotes: serializer.fromJson<String?>(json['inspectionNotes']),
      updatedAt: serializer.fromJson<String>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'imei': serializer.toJson<String>(imei),
      'statusCode': serializer.toJson<String>(statusCode),
      'version': serializer.toJson<int>(version),
      'targetPrice': serializer.toJson<String?>(targetPrice),
      'specs': serializer.toJson<String>(specs),
      'modelId': serializer.toJson<String>(modelId),
      'modelBrand': serializer.toJson<String>(modelBrand),
      'modelName': serializer.toJson<String>(modelName),
      'latestSale': serializer.toJson<String?>(latestSale),
      'gradeCode': serializer.toJson<String?>(gradeCode),
      'inspectionNotes': serializer.toJson<String?>(inspectionNotes),
      'updatedAt': serializer.toJson<String>(updatedAt),
    };
  }

  Device copyWith({
    String? id,
    String? imei,
    String? statusCode,
    int? version,
    Value<String?> targetPrice = const Value.absent(),
    String? specs,
    String? modelId,
    String? modelBrand,
    String? modelName,
    Value<String?> latestSale = const Value.absent(),
    Value<String?> gradeCode = const Value.absent(),
    Value<String?> inspectionNotes = const Value.absent(),
    String? updatedAt,
  }) => Device(
    id: id ?? this.id,
    imei: imei ?? this.imei,
    statusCode: statusCode ?? this.statusCode,
    version: version ?? this.version,
    targetPrice: targetPrice.present ? targetPrice.value : this.targetPrice,
    specs: specs ?? this.specs,
    modelId: modelId ?? this.modelId,
    modelBrand: modelBrand ?? this.modelBrand,
    modelName: modelName ?? this.modelName,
    latestSale: latestSale.present ? latestSale.value : this.latestSale,
    gradeCode: gradeCode.present ? gradeCode.value : this.gradeCode,
    inspectionNotes: inspectionNotes.present
        ? inspectionNotes.value
        : this.inspectionNotes,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  Device copyWithCompanion(DevicesCompanion data) {
    return Device(
      id: data.id.present ? data.id.value : this.id,
      imei: data.imei.present ? data.imei.value : this.imei,
      statusCode: data.statusCode.present
          ? data.statusCode.value
          : this.statusCode,
      version: data.version.present ? data.version.value : this.version,
      targetPrice: data.targetPrice.present
          ? data.targetPrice.value
          : this.targetPrice,
      specs: data.specs.present ? data.specs.value : this.specs,
      modelId: data.modelId.present ? data.modelId.value : this.modelId,
      modelBrand: data.modelBrand.present
          ? data.modelBrand.value
          : this.modelBrand,
      modelName: data.modelName.present ? data.modelName.value : this.modelName,
      latestSale: data.latestSale.present
          ? data.latestSale.value
          : this.latestSale,
      gradeCode: data.gradeCode.present ? data.gradeCode.value : this.gradeCode,
      inspectionNotes: data.inspectionNotes.present
          ? data.inspectionNotes.value
          : this.inspectionNotes,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Device(')
          ..write('id: $id, ')
          ..write('imei: $imei, ')
          ..write('statusCode: $statusCode, ')
          ..write('version: $version, ')
          ..write('targetPrice: $targetPrice, ')
          ..write('specs: $specs, ')
          ..write('modelId: $modelId, ')
          ..write('modelBrand: $modelBrand, ')
          ..write('modelName: $modelName, ')
          ..write('latestSale: $latestSale, ')
          ..write('gradeCode: $gradeCode, ')
          ..write('inspectionNotes: $inspectionNotes, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    imei,
    statusCode,
    version,
    targetPrice,
    specs,
    modelId,
    modelBrand,
    modelName,
    latestSale,
    gradeCode,
    inspectionNotes,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Device &&
          other.id == this.id &&
          other.imei == this.imei &&
          other.statusCode == this.statusCode &&
          other.version == this.version &&
          other.targetPrice == this.targetPrice &&
          other.specs == this.specs &&
          other.modelId == this.modelId &&
          other.modelBrand == this.modelBrand &&
          other.modelName == this.modelName &&
          other.latestSale == this.latestSale &&
          other.gradeCode == this.gradeCode &&
          other.inspectionNotes == this.inspectionNotes &&
          other.updatedAt == this.updatedAt);
}

class DevicesCompanion extends UpdateCompanion<Device> {
  final Value<String> id;
  final Value<String> imei;
  final Value<String> statusCode;
  final Value<int> version;
  final Value<String?> targetPrice;
  final Value<String> specs;
  final Value<String> modelId;
  final Value<String> modelBrand;
  final Value<String> modelName;
  final Value<String?> latestSale;
  final Value<String?> gradeCode;
  final Value<String?> inspectionNotes;
  final Value<String> updatedAt;
  final Value<int> rowid;
  const DevicesCompanion({
    this.id = const Value.absent(),
    this.imei = const Value.absent(),
    this.statusCode = const Value.absent(),
    this.version = const Value.absent(),
    this.targetPrice = const Value.absent(),
    this.specs = const Value.absent(),
    this.modelId = const Value.absent(),
    this.modelBrand = const Value.absent(),
    this.modelName = const Value.absent(),
    this.latestSale = const Value.absent(),
    this.gradeCode = const Value.absent(),
    this.inspectionNotes = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  DevicesCompanion.insert({
    required String id,
    required String imei,
    required String statusCode,
    required int version,
    this.targetPrice = const Value.absent(),
    this.specs = const Value.absent(),
    required String modelId,
    required String modelBrand,
    required String modelName,
    this.latestSale = const Value.absent(),
    this.gradeCode = const Value.absent(),
    this.inspectionNotes = const Value.absent(),
    required String updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       imei = Value(imei),
       statusCode = Value(statusCode),
       version = Value(version),
       modelId = Value(modelId),
       modelBrand = Value(modelBrand),
       modelName = Value(modelName),
       updatedAt = Value(updatedAt);
  static Insertable<Device> custom({
    Expression<String>? id,
    Expression<String>? imei,
    Expression<String>? statusCode,
    Expression<int>? version,
    Expression<String>? targetPrice,
    Expression<String>? specs,
    Expression<String>? modelId,
    Expression<String>? modelBrand,
    Expression<String>? modelName,
    Expression<String>? latestSale,
    Expression<String>? gradeCode,
    Expression<String>? inspectionNotes,
    Expression<String>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (imei != null) 'imei': imei,
      if (statusCode != null) 'status_code': statusCode,
      if (version != null) 'version': version,
      if (targetPrice != null) 'target_price': targetPrice,
      if (specs != null) 'specs': specs,
      if (modelId != null) 'model_id': modelId,
      if (modelBrand != null) 'model_brand': modelBrand,
      if (modelName != null) 'model_name': modelName,
      if (latestSale != null) 'latest_sale': latestSale,
      if (gradeCode != null) 'grade_code': gradeCode,
      if (inspectionNotes != null) 'inspection_notes': inspectionNotes,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  DevicesCompanion copyWith({
    Value<String>? id,
    Value<String>? imei,
    Value<String>? statusCode,
    Value<int>? version,
    Value<String?>? targetPrice,
    Value<String>? specs,
    Value<String>? modelId,
    Value<String>? modelBrand,
    Value<String>? modelName,
    Value<String?>? latestSale,
    Value<String?>? gradeCode,
    Value<String?>? inspectionNotes,
    Value<String>? updatedAt,
    Value<int>? rowid,
  }) {
    return DevicesCompanion(
      id: id ?? this.id,
      imei: imei ?? this.imei,
      statusCode: statusCode ?? this.statusCode,
      version: version ?? this.version,
      targetPrice: targetPrice ?? this.targetPrice,
      specs: specs ?? this.specs,
      modelId: modelId ?? this.modelId,
      modelBrand: modelBrand ?? this.modelBrand,
      modelName: modelName ?? this.modelName,
      latestSale: latestSale ?? this.latestSale,
      gradeCode: gradeCode ?? this.gradeCode,
      inspectionNotes: inspectionNotes ?? this.inspectionNotes,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (imei.present) {
      map['imei'] = Variable<String>(imei.value);
    }
    if (statusCode.present) {
      map['status_code'] = Variable<String>(statusCode.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (targetPrice.present) {
      map['target_price'] = Variable<String>(targetPrice.value);
    }
    if (specs.present) {
      map['specs'] = Variable<String>(specs.value);
    }
    if (modelId.present) {
      map['model_id'] = Variable<String>(modelId.value);
    }
    if (modelBrand.present) {
      map['model_brand'] = Variable<String>(modelBrand.value);
    }
    if (modelName.present) {
      map['model_name'] = Variable<String>(modelName.value);
    }
    if (latestSale.present) {
      map['latest_sale'] = Variable<String>(latestSale.value);
    }
    if (gradeCode.present) {
      map['grade_code'] = Variable<String>(gradeCode.value);
    }
    if (inspectionNotes.present) {
      map['inspection_notes'] = Variable<String>(inspectionNotes.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DevicesCompanion(')
          ..write('id: $id, ')
          ..write('imei: $imei, ')
          ..write('statusCode: $statusCode, ')
          ..write('version: $version, ')
          ..write('targetPrice: $targetPrice, ')
          ..write('specs: $specs, ')
          ..write('modelId: $modelId, ')
          ..write('modelBrand: $modelBrand, ')
          ..write('modelName: $modelName, ')
          ..write('latestSale: $latestSale, ')
          ..write('gradeCode: $gradeCode, ')
          ..write('inspectionNotes: $inspectionNotes, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PartnersTable extends Partners with TableInfo<$PartnersTable, Partner> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PartnersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _shopNameMeta = const VerificationMeta(
    'shopName',
  );
  @override
  late final GeneratedColumn<String> shopName = GeneratedColumn<String>(
    'shop_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
    'phone',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _creditLimitMeta = const VerificationMeta(
    'creditLimit',
  );
  @override
  late final GeneratedColumn<String> creditLimit = GeneratedColumn<String>(
    'credit_limit',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _outstandingMeta = const VerificationMeta(
    'outstanding',
  );
  @override
  late final GeneratedColumn<String> outstanding = GeneratedColumn<String>(
    'outstanding',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    shopName,
    phone,
    creditLimit,
    outstanding,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'partners';
  @override
  VerificationContext validateIntegrity(
    Insertable<Partner> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('shop_name')) {
      context.handle(
        _shopNameMeta,
        shopName.isAcceptableOrUnknown(data['shop_name']!, _shopNameMeta),
      );
    } else if (isInserting) {
      context.missing(_shopNameMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
        _phoneMeta,
        phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta),
      );
    }
    if (data.containsKey('credit_limit')) {
      context.handle(
        _creditLimitMeta,
        creditLimit.isAcceptableOrUnknown(
          data['credit_limit']!,
          _creditLimitMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_creditLimitMeta);
    }
    if (data.containsKey('outstanding')) {
      context.handle(
        _outstandingMeta,
        outstanding.isAcceptableOrUnknown(
          data['outstanding']!,
          _outstandingMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_outstandingMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Partner map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Partner(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      shopName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}shop_name'],
      )!,
      phone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone'],
      ),
      creditLimit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}credit_limit'],
      )!,
      outstanding: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}outstanding'],
      )!,
    );
  }

  @override
  $PartnersTable createAlias(String alias) {
    return $PartnersTable(attachedDatabase, alias);
  }
}

class Partner extends DataClass implements Insertable<Partner> {
  final String id;
  final String shopName;
  final String? phone;
  final String creditLimit;
  final String outstanding;
  const Partner({
    required this.id,
    required this.shopName,
    this.phone,
    required this.creditLimit,
    required this.outstanding,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['shop_name'] = Variable<String>(shopName);
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    map['credit_limit'] = Variable<String>(creditLimit);
    map['outstanding'] = Variable<String>(outstanding);
    return map;
  }

  PartnersCompanion toCompanion(bool nullToAbsent) {
    return PartnersCompanion(
      id: Value(id),
      shopName: Value(shopName),
      phone: phone == null && nullToAbsent
          ? const Value.absent()
          : Value(phone),
      creditLimit: Value(creditLimit),
      outstanding: Value(outstanding),
    );
  }

  factory Partner.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Partner(
      id: serializer.fromJson<String>(json['id']),
      shopName: serializer.fromJson<String>(json['shopName']),
      phone: serializer.fromJson<String?>(json['phone']),
      creditLimit: serializer.fromJson<String>(json['creditLimit']),
      outstanding: serializer.fromJson<String>(json['outstanding']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'shopName': serializer.toJson<String>(shopName),
      'phone': serializer.toJson<String?>(phone),
      'creditLimit': serializer.toJson<String>(creditLimit),
      'outstanding': serializer.toJson<String>(outstanding),
    };
  }

  Partner copyWith({
    String? id,
    String? shopName,
    Value<String?> phone = const Value.absent(),
    String? creditLimit,
    String? outstanding,
  }) => Partner(
    id: id ?? this.id,
    shopName: shopName ?? this.shopName,
    phone: phone.present ? phone.value : this.phone,
    creditLimit: creditLimit ?? this.creditLimit,
    outstanding: outstanding ?? this.outstanding,
  );
  Partner copyWithCompanion(PartnersCompanion data) {
    return Partner(
      id: data.id.present ? data.id.value : this.id,
      shopName: data.shopName.present ? data.shopName.value : this.shopName,
      phone: data.phone.present ? data.phone.value : this.phone,
      creditLimit: data.creditLimit.present
          ? data.creditLimit.value
          : this.creditLimit,
      outstanding: data.outstanding.present
          ? data.outstanding.value
          : this.outstanding,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Partner(')
          ..write('id: $id, ')
          ..write('shopName: $shopName, ')
          ..write('phone: $phone, ')
          ..write('creditLimit: $creditLimit, ')
          ..write('outstanding: $outstanding')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, shopName, phone, creditLimit, outstanding);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Partner &&
          other.id == this.id &&
          other.shopName == this.shopName &&
          other.phone == this.phone &&
          other.creditLimit == this.creditLimit &&
          other.outstanding == this.outstanding);
}

class PartnersCompanion extends UpdateCompanion<Partner> {
  final Value<String> id;
  final Value<String> shopName;
  final Value<String?> phone;
  final Value<String> creditLimit;
  final Value<String> outstanding;
  final Value<int> rowid;
  const PartnersCompanion({
    this.id = const Value.absent(),
    this.shopName = const Value.absent(),
    this.phone = const Value.absent(),
    this.creditLimit = const Value.absent(),
    this.outstanding = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  PartnersCompanion.insert({
    required String id,
    required String shopName,
    this.phone = const Value.absent(),
    required String creditLimit,
    required String outstanding,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       shopName = Value(shopName),
       creditLimit = Value(creditLimit),
       outstanding = Value(outstanding);
  static Insertable<Partner> custom({
    Expression<String>? id,
    Expression<String>? shopName,
    Expression<String>? phone,
    Expression<String>? creditLimit,
    Expression<String>? outstanding,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (shopName != null) 'shop_name': shopName,
      if (phone != null) 'phone': phone,
      if (creditLimit != null) 'credit_limit': creditLimit,
      if (outstanding != null) 'outstanding': outstanding,
      if (rowid != null) 'rowid': rowid,
    });
  }

  PartnersCompanion copyWith({
    Value<String>? id,
    Value<String>? shopName,
    Value<String?>? phone,
    Value<String>? creditLimit,
    Value<String>? outstanding,
    Value<int>? rowid,
  }) {
    return PartnersCompanion(
      id: id ?? this.id,
      shopName: shopName ?? this.shopName,
      phone: phone ?? this.phone,
      creditLimit: creditLimit ?? this.creditLimit,
      outstanding: outstanding ?? this.outstanding,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (shopName.present) {
      map['shop_name'] = Variable<String>(shopName.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (creditLimit.present) {
      map['credit_limit'] = Variable<String>(creditLimit.value);
    }
    if (outstanding.present) {
      map['outstanding'] = Variable<String>(outstanding.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PartnersCompanion(')
          ..write('id: $id, ')
          ..write('shopName: $shopName, ')
          ..write('phone: $phone, ')
          ..write('creditLimit: $creditLimit, ')
          ..write('outstanding: $outstanding, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $OutboxTable extends Outbox with TableInfo<$OutboxTable, OutboxData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OutboxTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _baseVersionMeta = const VerificationMeta(
    'baseVersion',
  );
  @override
  late final GeneratedColumn<int> baseVersion = GeneratedColumn<int>(
    'base_version',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _occurredAtMeta = const VerificationMeta(
    'occurredAt',
  );
  @override
  late final GeneratedColumn<String> occurredAt = GeneratedColumn<String>(
    'occurred_at',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  static const VerificationMeta _lastErrorMeta = const VerificationMeta(
    'lastError',
  );
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
    'last_error',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    type,
    payload,
    baseVersion,
    occurredAt,
    status,
    lastError,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'outbox';
  @override
  VerificationContext validateIntegrity(
    Insertable<OutboxData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
        _typeMeta,
        type.isAcceptableOrUnknown(data['type']!, _typeMeta),
      );
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('base_version')) {
      context.handle(
        _baseVersionMeta,
        baseVersion.isAcceptableOrUnknown(
          data['base_version']!,
          _baseVersionMeta,
        ),
      );
    }
    if (data.containsKey('occurred_at')) {
      context.handle(
        _occurredAtMeta,
        occurredAt.isAcceptableOrUnknown(data['occurred_at']!, _occurredAtMeta),
      );
    } else if (isInserting) {
      context.missing(_occurredAtMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('last_error')) {
      context.handle(
        _lastErrorMeta,
        lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  OutboxData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OutboxData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}type'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      baseVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}base_version'],
      ),
      occurredAt: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}occurred_at'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      lastError: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error'],
      ),
    );
  }

  @override
  $OutboxTable createAlias(String alias) {
    return $OutboxTable(attachedDatabase, alias);
  }
}

class OutboxData extends DataClass implements Insertable<OutboxData> {
  final String id;
  final String type;
  final String payload;
  final int? baseVersion;
  final String occurredAt;
  final String status;
  final String? lastError;
  const OutboxData({
    required this.id,
    required this.type,
    required this.payload,
    this.baseVersion,
    required this.occurredAt,
    required this.status,
    this.lastError,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['type'] = Variable<String>(type);
    map['payload'] = Variable<String>(payload);
    if (!nullToAbsent || baseVersion != null) {
      map['base_version'] = Variable<int>(baseVersion);
    }
    map['occurred_at'] = Variable<String>(occurredAt);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    return map;
  }

  OutboxCompanion toCompanion(bool nullToAbsent) {
    return OutboxCompanion(
      id: Value(id),
      type: Value(type),
      payload: Value(payload),
      baseVersion: baseVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(baseVersion),
      occurredAt: Value(occurredAt),
      status: Value(status),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
    );
  }

  factory OutboxData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OutboxData(
      id: serializer.fromJson<String>(json['id']),
      type: serializer.fromJson<String>(json['type']),
      payload: serializer.fromJson<String>(json['payload']),
      baseVersion: serializer.fromJson<int?>(json['baseVersion']),
      occurredAt: serializer.fromJson<String>(json['occurredAt']),
      status: serializer.fromJson<String>(json['status']),
      lastError: serializer.fromJson<String?>(json['lastError']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'type': serializer.toJson<String>(type),
      'payload': serializer.toJson<String>(payload),
      'baseVersion': serializer.toJson<int?>(baseVersion),
      'occurredAt': serializer.toJson<String>(occurredAt),
      'status': serializer.toJson<String>(status),
      'lastError': serializer.toJson<String?>(lastError),
    };
  }

  OutboxData copyWith({
    String? id,
    String? type,
    String? payload,
    Value<int?> baseVersion = const Value.absent(),
    String? occurredAt,
    String? status,
    Value<String?> lastError = const Value.absent(),
  }) => OutboxData(
    id: id ?? this.id,
    type: type ?? this.type,
    payload: payload ?? this.payload,
    baseVersion: baseVersion.present ? baseVersion.value : this.baseVersion,
    occurredAt: occurredAt ?? this.occurredAt,
    status: status ?? this.status,
    lastError: lastError.present ? lastError.value : this.lastError,
  );
  OutboxData copyWithCompanion(OutboxCompanion data) {
    return OutboxData(
      id: data.id.present ? data.id.value : this.id,
      type: data.type.present ? data.type.value : this.type,
      payload: data.payload.present ? data.payload.value : this.payload,
      baseVersion: data.baseVersion.present
          ? data.baseVersion.value
          : this.baseVersion,
      occurredAt: data.occurredAt.present
          ? data.occurredAt.value
          : this.occurredAt,
      status: data.status.present ? data.status.value : this.status,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OutboxData(')
          ..write('id: $id, ')
          ..write('type: $type, ')
          ..write('payload: $payload, ')
          ..write('baseVersion: $baseVersion, ')
          ..write('occurredAt: $occurredAt, ')
          ..write('status: $status, ')
          ..write('lastError: $lastError')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    type,
    payload,
    baseVersion,
    occurredAt,
    status,
    lastError,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OutboxData &&
          other.id == this.id &&
          other.type == this.type &&
          other.payload == this.payload &&
          other.baseVersion == this.baseVersion &&
          other.occurredAt == this.occurredAt &&
          other.status == this.status &&
          other.lastError == this.lastError);
}

class OutboxCompanion extends UpdateCompanion<OutboxData> {
  final Value<String> id;
  final Value<String> type;
  final Value<String> payload;
  final Value<int?> baseVersion;
  final Value<String> occurredAt;
  final Value<String> status;
  final Value<String?> lastError;
  final Value<int> rowid;
  const OutboxCompanion({
    this.id = const Value.absent(),
    this.type = const Value.absent(),
    this.payload = const Value.absent(),
    this.baseVersion = const Value.absent(),
    this.occurredAt = const Value.absent(),
    this.status = const Value.absent(),
    this.lastError = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  OutboxCompanion.insert({
    required String id,
    required String type,
    required String payload,
    this.baseVersion = const Value.absent(),
    required String occurredAt,
    this.status = const Value.absent(),
    this.lastError = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       type = Value(type),
       payload = Value(payload),
       occurredAt = Value(occurredAt);
  static Insertable<OutboxData> custom({
    Expression<String>? id,
    Expression<String>? type,
    Expression<String>? payload,
    Expression<int>? baseVersion,
    Expression<String>? occurredAt,
    Expression<String>? status,
    Expression<String>? lastError,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (type != null) 'type': type,
      if (payload != null) 'payload': payload,
      if (baseVersion != null) 'base_version': baseVersion,
      if (occurredAt != null) 'occurred_at': occurredAt,
      if (status != null) 'status': status,
      if (lastError != null) 'last_error': lastError,
      if (rowid != null) 'rowid': rowid,
    });
  }

  OutboxCompanion copyWith({
    Value<String>? id,
    Value<String>? type,
    Value<String>? payload,
    Value<int?>? baseVersion,
    Value<String>? occurredAt,
    Value<String>? status,
    Value<String?>? lastError,
    Value<int>? rowid,
  }) {
    return OutboxCompanion(
      id: id ?? this.id,
      type: type ?? this.type,
      payload: payload ?? this.payload,
      baseVersion: baseVersion ?? this.baseVersion,
      occurredAt: occurredAt ?? this.occurredAt,
      status: status ?? this.status,
      lastError: lastError ?? this.lastError,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (baseVersion.present) {
      map['base_version'] = Variable<int>(baseVersion.value);
    }
    if (occurredAt.present) {
      map['occurred_at'] = Variable<String>(occurredAt.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OutboxCompanion(')
          ..write('id: $id, ')
          ..write('type: $type, ')
          ..write('payload: $payload, ')
          ..write('baseVersion: $baseVersion, ')
          ..write('occurredAt: $occurredAt, ')
          ..write('status: $status, ')
          ..write('lastError: $lastError, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncMetaTable extends SyncMeta
    with TableInfo<$SyncMetaTable, SyncMetaData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncMetaTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_meta';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncMetaData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  SyncMetaData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncMetaData(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  $SyncMetaTable createAlias(String alias) {
    return $SyncMetaTable(attachedDatabase, alias);
  }
}

class SyncMetaData extends DataClass implements Insertable<SyncMetaData> {
  final String key;
  final String value;
  const SyncMetaData({required this.key, required this.value});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    return map;
  }

  SyncMetaCompanion toCompanion(bool nullToAbsent) {
    return SyncMetaCompanion(key: Value(key), value: Value(value));
  }

  factory SyncMetaData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncMetaData(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
    };
  }

  SyncMetaData copyWith({String? key, String? value}) =>
      SyncMetaData(key: key ?? this.key, value: value ?? this.value);
  SyncMetaData copyWithCompanion(SyncMetaCompanion data) {
    return SyncMetaData(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetaData(')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncMetaData &&
          other.key == this.key &&
          other.value == this.value);
}

class SyncMetaCompanion extends UpdateCompanion<SyncMetaData> {
  final Value<String> key;
  final Value<String> value;
  final Value<int> rowid;
  const SyncMetaCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncMetaCompanion.insert({
    required String key,
    required String value,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value);
  static Insertable<SyncMetaData> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncMetaCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<int>? rowid,
  }) {
    return SyncMetaCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetaCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $DevicesTable devices = $DevicesTable(this);
  late final $PartnersTable partners = $PartnersTable(this);
  late final $OutboxTable outbox = $OutboxTable(this);
  late final $SyncMetaTable syncMeta = $SyncMetaTable(this);
  late final DeviceDao deviceDao = DeviceDao(this as AppDatabase);
  late final PartnerDao partnerDao = PartnerDao(this as AppDatabase);
  late final OutboxDao outboxDao = OutboxDao(this as AppDatabase);
  late final SyncMetaDao syncMetaDao = SyncMetaDao(this as AppDatabase);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    devices,
    partners,
    outbox,
    syncMeta,
  ];
}

typedef $$DevicesTableCreateCompanionBuilder =
    DevicesCompanion Function({
      required String id,
      required String imei,
      required String statusCode,
      required int version,
      Value<String?> targetPrice,
      Value<String> specs,
      required String modelId,
      required String modelBrand,
      required String modelName,
      Value<String?> latestSale,
      Value<String?> gradeCode,
      Value<String?> inspectionNotes,
      required String updatedAt,
      Value<int> rowid,
    });
typedef $$DevicesTableUpdateCompanionBuilder =
    DevicesCompanion Function({
      Value<String> id,
      Value<String> imei,
      Value<String> statusCode,
      Value<int> version,
      Value<String?> targetPrice,
      Value<String> specs,
      Value<String> modelId,
      Value<String> modelBrand,
      Value<String> modelName,
      Value<String?> latestSale,
      Value<String?> gradeCode,
      Value<String?> inspectionNotes,
      Value<String> updatedAt,
      Value<int> rowid,
    });

class $$DevicesTableFilterComposer
    extends Composer<_$AppDatabase, $DevicesTable> {
  $$DevicesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get imei => $composableBuilder(
    column: $table.imei,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get statusCode => $composableBuilder(
    column: $table.statusCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get targetPrice => $composableBuilder(
    column: $table.targetPrice,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get specs => $composableBuilder(
    column: $table.specs,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get modelId => $composableBuilder(
    column: $table.modelId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get modelBrand => $composableBuilder(
    column: $table.modelBrand,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get modelName => $composableBuilder(
    column: $table.modelName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get latestSale => $composableBuilder(
    column: $table.latestSale,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get gradeCode => $composableBuilder(
    column: $table.gradeCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get inspectionNotes => $composableBuilder(
    column: $table.inspectionNotes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$DevicesTableOrderingComposer
    extends Composer<_$AppDatabase, $DevicesTable> {
  $$DevicesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get imei => $composableBuilder(
    column: $table.imei,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get statusCode => $composableBuilder(
    column: $table.statusCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get targetPrice => $composableBuilder(
    column: $table.targetPrice,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get specs => $composableBuilder(
    column: $table.specs,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get modelId => $composableBuilder(
    column: $table.modelId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get modelBrand => $composableBuilder(
    column: $table.modelBrand,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get modelName => $composableBuilder(
    column: $table.modelName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get latestSale => $composableBuilder(
    column: $table.latestSale,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get gradeCode => $composableBuilder(
    column: $table.gradeCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get inspectionNotes => $composableBuilder(
    column: $table.inspectionNotes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$DevicesTableAnnotationComposer
    extends Composer<_$AppDatabase, $DevicesTable> {
  $$DevicesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get imei =>
      $composableBuilder(column: $table.imei, builder: (column) => column);

  GeneratedColumn<String> get statusCode => $composableBuilder(
    column: $table.statusCode,
    builder: (column) => column,
  );

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);

  GeneratedColumn<String> get targetPrice => $composableBuilder(
    column: $table.targetPrice,
    builder: (column) => column,
  );

  GeneratedColumn<String> get specs =>
      $composableBuilder(column: $table.specs, builder: (column) => column);

  GeneratedColumn<String> get modelId =>
      $composableBuilder(column: $table.modelId, builder: (column) => column);

  GeneratedColumn<String> get modelBrand => $composableBuilder(
    column: $table.modelBrand,
    builder: (column) => column,
  );

  GeneratedColumn<String> get modelName =>
      $composableBuilder(column: $table.modelName, builder: (column) => column);

  GeneratedColumn<String> get latestSale => $composableBuilder(
    column: $table.latestSale,
    builder: (column) => column,
  );

  GeneratedColumn<String> get gradeCode =>
      $composableBuilder(column: $table.gradeCode, builder: (column) => column);

  GeneratedColumn<String> get inspectionNotes => $composableBuilder(
    column: $table.inspectionNotes,
    builder: (column) => column,
  );

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$DevicesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $DevicesTable,
          Device,
          $$DevicesTableFilterComposer,
          $$DevicesTableOrderingComposer,
          $$DevicesTableAnnotationComposer,
          $$DevicesTableCreateCompanionBuilder,
          $$DevicesTableUpdateCompanionBuilder,
          (Device, BaseReferences<_$AppDatabase, $DevicesTable, Device>),
          Device,
          PrefetchHooks Function()
        > {
  $$DevicesTableTableManager(_$AppDatabase db, $DevicesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DevicesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DevicesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DevicesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> imei = const Value.absent(),
                Value<String> statusCode = const Value.absent(),
                Value<int> version = const Value.absent(),
                Value<String?> targetPrice = const Value.absent(),
                Value<String> specs = const Value.absent(),
                Value<String> modelId = const Value.absent(),
                Value<String> modelBrand = const Value.absent(),
                Value<String> modelName = const Value.absent(),
                Value<String?> latestSale = const Value.absent(),
                Value<String?> gradeCode = const Value.absent(),
                Value<String?> inspectionNotes = const Value.absent(),
                Value<String> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => DevicesCompanion(
                id: id,
                imei: imei,
                statusCode: statusCode,
                version: version,
                targetPrice: targetPrice,
                specs: specs,
                modelId: modelId,
                modelBrand: modelBrand,
                modelName: modelName,
                latestSale: latestSale,
                gradeCode: gradeCode,
                inspectionNotes: inspectionNotes,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String imei,
                required String statusCode,
                required int version,
                Value<String?> targetPrice = const Value.absent(),
                Value<String> specs = const Value.absent(),
                required String modelId,
                required String modelBrand,
                required String modelName,
                Value<String?> latestSale = const Value.absent(),
                Value<String?> gradeCode = const Value.absent(),
                Value<String?> inspectionNotes = const Value.absent(),
                required String updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => DevicesCompanion.insert(
                id: id,
                imei: imei,
                statusCode: statusCode,
                version: version,
                targetPrice: targetPrice,
                specs: specs,
                modelId: modelId,
                modelBrand: modelBrand,
                modelName: modelName,
                latestSale: latestSale,
                gradeCode: gradeCode,
                inspectionNotes: inspectionNotes,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$DevicesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $DevicesTable,
      Device,
      $$DevicesTableFilterComposer,
      $$DevicesTableOrderingComposer,
      $$DevicesTableAnnotationComposer,
      $$DevicesTableCreateCompanionBuilder,
      $$DevicesTableUpdateCompanionBuilder,
      (Device, BaseReferences<_$AppDatabase, $DevicesTable, Device>),
      Device,
      PrefetchHooks Function()
    >;
typedef $$PartnersTableCreateCompanionBuilder =
    PartnersCompanion Function({
      required String id,
      required String shopName,
      Value<String?> phone,
      required String creditLimit,
      required String outstanding,
      Value<int> rowid,
    });
typedef $$PartnersTableUpdateCompanionBuilder =
    PartnersCompanion Function({
      Value<String> id,
      Value<String> shopName,
      Value<String?> phone,
      Value<String> creditLimit,
      Value<String> outstanding,
      Value<int> rowid,
    });

class $$PartnersTableFilterComposer
    extends Composer<_$AppDatabase, $PartnersTable> {
  $$PartnersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get shopName => $composableBuilder(
    column: $table.shopName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get creditLimit => $composableBuilder(
    column: $table.creditLimit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get outstanding => $composableBuilder(
    column: $table.outstanding,
    builder: (column) => ColumnFilters(column),
  );
}

class $$PartnersTableOrderingComposer
    extends Composer<_$AppDatabase, $PartnersTable> {
  $$PartnersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get shopName => $composableBuilder(
    column: $table.shopName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get creditLimit => $composableBuilder(
    column: $table.creditLimit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get outstanding => $composableBuilder(
    column: $table.outstanding,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$PartnersTableAnnotationComposer
    extends Composer<_$AppDatabase, $PartnersTable> {
  $$PartnersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get shopName =>
      $composableBuilder(column: $table.shopName, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get creditLimit => $composableBuilder(
    column: $table.creditLimit,
    builder: (column) => column,
  );

  GeneratedColumn<String> get outstanding => $composableBuilder(
    column: $table.outstanding,
    builder: (column) => column,
  );
}

class $$PartnersTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $PartnersTable,
          Partner,
          $$PartnersTableFilterComposer,
          $$PartnersTableOrderingComposer,
          $$PartnersTableAnnotationComposer,
          $$PartnersTableCreateCompanionBuilder,
          $$PartnersTableUpdateCompanionBuilder,
          (Partner, BaseReferences<_$AppDatabase, $PartnersTable, Partner>),
          Partner,
          PrefetchHooks Function()
        > {
  $$PartnersTableTableManager(_$AppDatabase db, $PartnersTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PartnersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PartnersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PartnersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> shopName = const Value.absent(),
                Value<String?> phone = const Value.absent(),
                Value<String> creditLimit = const Value.absent(),
                Value<String> outstanding = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PartnersCompanion(
                id: id,
                shopName: shopName,
                phone: phone,
                creditLimit: creditLimit,
                outstanding: outstanding,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String shopName,
                Value<String?> phone = const Value.absent(),
                required String creditLimit,
                required String outstanding,
                Value<int> rowid = const Value.absent(),
              }) => PartnersCompanion.insert(
                id: id,
                shopName: shopName,
                phone: phone,
                creditLimit: creditLimit,
                outstanding: outstanding,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PartnersTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $PartnersTable,
      Partner,
      $$PartnersTableFilterComposer,
      $$PartnersTableOrderingComposer,
      $$PartnersTableAnnotationComposer,
      $$PartnersTableCreateCompanionBuilder,
      $$PartnersTableUpdateCompanionBuilder,
      (Partner, BaseReferences<_$AppDatabase, $PartnersTable, Partner>),
      Partner,
      PrefetchHooks Function()
    >;
typedef $$OutboxTableCreateCompanionBuilder =
    OutboxCompanion Function({
      required String id,
      required String type,
      required String payload,
      Value<int?> baseVersion,
      required String occurredAt,
      Value<String> status,
      Value<String?> lastError,
      Value<int> rowid,
    });
typedef $$OutboxTableUpdateCompanionBuilder =
    OutboxCompanion Function({
      Value<String> id,
      Value<String> type,
      Value<String> payload,
      Value<int?> baseVersion,
      Value<String> occurredAt,
      Value<String> status,
      Value<String?> lastError,
      Value<int> rowid,
    });

class $$OutboxTableFilterComposer
    extends Composer<_$AppDatabase, $OutboxTable> {
  $$OutboxTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get baseVersion => $composableBuilder(
    column: $table.baseVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnFilters(column),
  );
}

class $$OutboxTableOrderingComposer
    extends Composer<_$AppDatabase, $OutboxTable> {
  $$OutboxTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get baseVersion => $composableBuilder(
    column: $table.baseVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$OutboxTableAnnotationComposer
    extends Composer<_$AppDatabase, $OutboxTable> {
  $$OutboxTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<int> get baseVersion => $composableBuilder(
    column: $table.baseVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);
}

class $$OutboxTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $OutboxTable,
          OutboxData,
          $$OutboxTableFilterComposer,
          $$OutboxTableOrderingComposer,
          $$OutboxTableAnnotationComposer,
          $$OutboxTableCreateCompanionBuilder,
          $$OutboxTableUpdateCompanionBuilder,
          (OutboxData, BaseReferences<_$AppDatabase, $OutboxTable, OutboxData>),
          OutboxData,
          PrefetchHooks Function()
        > {
  $$OutboxTableTableManager(_$AppDatabase db, $OutboxTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OutboxTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OutboxTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OutboxTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> type = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<int?> baseVersion = const Value.absent(),
                Value<String> occurredAt = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => OutboxCompanion(
                id: id,
                type: type,
                payload: payload,
                baseVersion: baseVersion,
                occurredAt: occurredAt,
                status: status,
                lastError: lastError,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String type,
                required String payload,
                Value<int?> baseVersion = const Value.absent(),
                required String occurredAt,
                Value<String> status = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => OutboxCompanion.insert(
                id: id,
                type: type,
                payload: payload,
                baseVersion: baseVersion,
                occurredAt: occurredAt,
                status: status,
                lastError: lastError,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$OutboxTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $OutboxTable,
      OutboxData,
      $$OutboxTableFilterComposer,
      $$OutboxTableOrderingComposer,
      $$OutboxTableAnnotationComposer,
      $$OutboxTableCreateCompanionBuilder,
      $$OutboxTableUpdateCompanionBuilder,
      (OutboxData, BaseReferences<_$AppDatabase, $OutboxTable, OutboxData>),
      OutboxData,
      PrefetchHooks Function()
    >;
typedef $$SyncMetaTableCreateCompanionBuilder =
    SyncMetaCompanion Function({
      required String key,
      required String value,
      Value<int> rowid,
    });
typedef $$SyncMetaTableUpdateCompanionBuilder =
    SyncMetaCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<int> rowid,
    });

class $$SyncMetaTableFilterComposer
    extends Composer<_$AppDatabase, $SyncMetaTable> {
  $$SyncMetaTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncMetaTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncMetaTable> {
  $$SyncMetaTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncMetaTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncMetaTable> {
  $$SyncMetaTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);
}

class $$SyncMetaTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncMetaTable,
          SyncMetaData,
          $$SyncMetaTableFilterComposer,
          $$SyncMetaTableOrderingComposer,
          $$SyncMetaTableAnnotationComposer,
          $$SyncMetaTableCreateCompanionBuilder,
          $$SyncMetaTableUpdateCompanionBuilder,
          (
            SyncMetaData,
            BaseReferences<_$AppDatabase, $SyncMetaTable, SyncMetaData>,
          ),
          SyncMetaData,
          PrefetchHooks Function()
        > {
  $$SyncMetaTableTableManager(_$AppDatabase db, $SyncMetaTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncMetaTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncMetaTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncMetaTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> value = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncMetaCompanion(key: key, value: value, rowid: rowid),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                Value<int> rowid = const Value.absent(),
              }) => SyncMetaCompanion.insert(
                key: key,
                value: value,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncMetaTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncMetaTable,
      SyncMetaData,
      $$SyncMetaTableFilterComposer,
      $$SyncMetaTableOrderingComposer,
      $$SyncMetaTableAnnotationComposer,
      $$SyncMetaTableCreateCompanionBuilder,
      $$SyncMetaTableUpdateCompanionBuilder,
      (
        SyncMetaData,
        BaseReferences<_$AppDatabase, $SyncMetaTable, SyncMetaData>,
      ),
      SyncMetaData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$DevicesTableTableManager get devices =>
      $$DevicesTableTableManager(_db, _db.devices);
  $$PartnersTableTableManager get partners =>
      $$PartnersTableTableManager(_db, _db.partners);
  $$OutboxTableTableManager get outbox =>
      $$OutboxTableTableManager(_db, _db.outbox);
  $$SyncMetaTableTableManager get syncMeta =>
      $$SyncMetaTableTableManager(_db, _db.syncMeta);
}

mixin _$DeviceDaoMixin on DatabaseAccessor<AppDatabase> {
  $DevicesTable get devices => attachedDatabase.devices;
  DeviceDaoManager get managers => DeviceDaoManager(this);
}

class DeviceDaoManager {
  final _$DeviceDaoMixin _db;
  DeviceDaoManager(this._db);
  $$DevicesTableTableManager get devices =>
      $$DevicesTableTableManager(_db.attachedDatabase, _db.devices);
}

mixin _$PartnerDaoMixin on DatabaseAccessor<AppDatabase> {
  $PartnersTable get partners => attachedDatabase.partners;
  PartnerDaoManager get managers => PartnerDaoManager(this);
}

class PartnerDaoManager {
  final _$PartnerDaoMixin _db;
  PartnerDaoManager(this._db);
  $$PartnersTableTableManager get partners =>
      $$PartnersTableTableManager(_db.attachedDatabase, _db.partners);
}

mixin _$OutboxDaoMixin on DatabaseAccessor<AppDatabase> {
  $OutboxTable get outbox => attachedDatabase.outbox;
  OutboxDaoManager get managers => OutboxDaoManager(this);
}

class OutboxDaoManager {
  final _$OutboxDaoMixin _db;
  OutboxDaoManager(this._db);
  $$OutboxTableTableManager get outbox =>
      $$OutboxTableTableManager(_db.attachedDatabase, _db.outbox);
}

mixin _$SyncMetaDaoMixin on DatabaseAccessor<AppDatabase> {
  $SyncMetaTable get syncMeta => attachedDatabase.syncMeta;
  SyncMetaDaoManager get managers => SyncMetaDaoManager(this);
}

class SyncMetaDaoManager {
  final _$SyncMetaDaoMixin _db;
  SyncMetaDaoManager(this._db);
  $$SyncMetaTableTableManager get syncMeta =>
      $$SyncMetaTableTableManager(_db.attachedDatabase, _db.syncMeta);
}
