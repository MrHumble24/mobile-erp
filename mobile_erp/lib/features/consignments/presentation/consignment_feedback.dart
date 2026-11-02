import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';

/// One place the three consignment dialogs report their outcome. Online writes
/// show the success copy; queued (offline) writes show the offline/pending-sync
/// notice so the cashier knows it will sync later.
///
/// ponytail: offline uses `common.offline` until a dedicated
/// `consignments.pendingSync` key is added (reported to the i18n owner).
void showConsignmentResult(
  BuildContext context, {
  required bool queued,
  required String successKey,
}) {
  final message =
      queued ? context.t('common.offline') : context.t(successKey);
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
