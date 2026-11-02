import 'package:flutter/material.dart';

import '../../theme/tokens.dart';

/// Centered spinner for pending states.
class Loading extends StatelessWidget {
  const Loading({super.key});

  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator());
}

/// "Nothing here yet" placeholder with an optional icon and action.
class EmptyView extends StatelessWidget {
  const EmptyView({
    required this.message,
    this.icon = Icons.inbox_outlined,
    this.action,
    super.key,
  });

  final String message;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) => _CenteredStack(
        icon: icon,
        iconColor: AppColors.ash,
        message: message,
        action: action,
      );
}

/// Error state with the failure message and an optional retry.
class ErrorView extends StatelessWidget {
  const ErrorView({required this.message, this.onRetry, this.retryLabel, super.key});

  final String message;
  final VoidCallback? onRetry;
  final String? retryLabel;

  @override
  Widget build(BuildContext context) => _CenteredStack(
        icon: Icons.error_outline,
        iconColor: AppColors.danger,
        message: message,
        action: onRetry == null
            ? null
            : OutlinedButton(
                onPressed: onRetry,
                child: Text(retryLabel ?? 'Retry'),
              ),
      );
}

class _CenteredStack extends StatelessWidget {
  const _CenteredStack({
    required this.icon,
    required this.iconColor,
    required this.message,
    this.action,
  });

  final IconData icon;
  final Color iconColor;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: iconColor),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    );
  }
}
