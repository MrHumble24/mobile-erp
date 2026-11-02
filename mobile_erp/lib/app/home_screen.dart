import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/application/session_controller.dart';

/// Landing route (`/`) for authenticated users until the dashboard lands
/// (wave 6). Greets the signed-in user; nav lives in the shell.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionControllerProvider).valueOrNull;
    final name = user?.profile?.fullName ?? user?.email ?? '';
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Malika Bazaar', style: text.headlineMedium),
          const SizedBox(height: 8),
          Text(name, style: text.bodyLarge),
        ],
      ),
    );
  }
}
