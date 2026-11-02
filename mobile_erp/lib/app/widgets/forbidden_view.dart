import 'package:flutter/material.dart';

import '../../l10n/i18n.dart';
import '../../theme/tokens.dart';

/// Inline 403 shown when a user opens a section they lack permission for.
/// Copy: `common.forbidden` (Uzbek pending — Gemini handoff; en fallback shows).
class ForbiddenView extends StatelessWidget {
  const ForbiddenView({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, size: 48, color: AppColors.ash),
            const SizedBox(height: 12),
            Text(
              context.t('common.forbidden'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
