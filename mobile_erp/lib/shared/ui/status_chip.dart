import 'package:flutter/material.dart';

import '../../theme/tokens.dart';

/// A pill badge tinted by a semantic status color (12% fill, solid label).
/// Ported from the theme showcase. Pass [AppColors.success]/warning/danger.
class StatusChip extends StatelessWidget {
  const StatusChip(this.label, {required this.color, super.key});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadii.tags),
      ),
      child: Text(
        label,
        style: Theme.of(context)
            .textTheme
            .labelLarge
            ?.copyWith(color: color),
      ),
    );
  }
}
