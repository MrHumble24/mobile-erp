import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/device_model.dart';
import '../data/device_model_repository.dart';

/// Active + inactive models (the Models tab and the alert-rule picker read this).
final deviceModelsProvider = FutureProvider<List<DeviceModelView>>(
  (ref) => ref.watch(deviceModelRepositoryProvider).list(),
);

/// A single model's spec schema, used to drive the edit-device spec fields.
final modelAttributesProvider =
    FutureProvider.family<List<AttributeDef>, String>(
  (ref, modelId) => ref.watch(deviceModelRepositoryProvider).attributes(modelId),
);
