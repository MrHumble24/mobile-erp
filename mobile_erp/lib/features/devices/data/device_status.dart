import 'package:flutter/material.dart';

import '../../../theme/tokens.dart';

/// Status presentation + the manual transitions a user may trigger from the
/// device sheet. CONSIGNED and SOLD targets go through POS / Nasiya, never here,
/// so they are deliberately absent even though the server allows them.
class DeviceStatusMeta {
  DeviceStatusMeta._();

  static const _labelKey = {
    'IN_STOCK': 'inventory.statusInStock',
    'DEFECTIVE': 'inventory.statusDefective',
    'CONSIGNED': 'inventory.statusConsigned',
    'SOLD': 'inventory.statusSold',
  };

  static const _color = {
    'IN_STOCK': AppColors.success,
    'DEFECTIVE': AppColors.danger,
    'CONSIGNED': AppColors.signalBlue,
    'SOLD': AppColors.ash,
  };

  /// Manual status targets reachable from the device sheet, keyed by current.
  static const manualTransitions = {
    'IN_STOCK': ['DEFECTIVE'],
    'DEFECTIVE': ['IN_STOCK'],
    'SOLD': ['IN_STOCK', 'DEFECTIVE'],
    'CONSIGNED': <String>[],
  };

  static String labelKey(String code) => _labelKey[code] ?? code;

  static Color color(String code) => _color[code] ?? AppColors.ash;

  static List<String> transitionsFor(String code) =>
      manualTransitions[code] ?? const [];
}
