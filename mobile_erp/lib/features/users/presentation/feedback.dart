import 'package:flutter/material.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';

/// Slice-local toast glue: a success snackbar and an error snackbar that
/// unwraps an [AppException] into its message.
void showSuccess(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

void showError(BuildContext context, Object error) {
  final message = error is AppException ? error.message : context.t('common.error');
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: Theme.of(context).colorScheme.error,
    ));
}
