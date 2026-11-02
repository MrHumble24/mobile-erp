import 'package:flutter/material.dart';

import '../../theme/tokens.dart';

/// A bordered surface with the soft Caldera shadow. The default container for
/// grouped content. Tap-able when [onTap] is given.
class AppCard extends StatelessWidget {
  const AppCard({
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppRadii.cards);
    return Material(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: radius,
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: radius,
            border: Border.all(color: AppColors.bone),
            boxShadow: AppShadows.subtle2,
          ),
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}
