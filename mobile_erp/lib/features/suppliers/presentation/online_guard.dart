import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/sync/connectivity.dart';
import '../../../l10n/i18n.dart';

/// Procurement-wide guard for online-only writes (device/shipment/QC intake are
/// NOT among the 4 offline mutation types, so they must never fake-queue).
/// Returns true when online; otherwise shows the offline message and returns false.
///
/// ponytail: lives in the suppliers slice as the dependency root the other
/// procurement slices (shipments, qc) import; promote to a shared/ helper if a
/// non-procurement consumer ever needs it.
bool ensureOnline(WidgetRef ref, BuildContext context) {
  final online = ref.read(connectivityProvider).valueOrNull ?? true;
  if (!online) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(context.t('common.offline'))),
    );
  }
  return online;
}
