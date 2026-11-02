import 'package:flutter/material.dart';

import 'theme/app_theme.dart';
import 'theme/tokens.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Malika Bazaar',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const _ThemeShowcase(),
    );
  }
}

/// Smoke screen that exercises the ported tokens so the theme is verifiable.
class _ThemeShowcase extends StatelessWidget {
  const _ThemeShowcase();

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Caldera')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Malika Bazaar', style: t.headlineMedium),
          const SizedBox(height: 4),
          Text('Local-first ERP / POS', style: t.bodyMedium),
          const SizedBox(height: 24),
          const _ColorRow(),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Card surface', style: t.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    'Bone border, 12px radius, soft Caldera shadow applied below.',
                    style: t.bodyMedium,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceCanvas,
              borderRadius: BorderRadius.circular(AppRadii.largeCards),
              boxShadow: AppShadows.lg,
            ),
            child: Text('Elevated panel — shadow-lg', style: t.bodyLarge),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton(onPressed: () {}, child: const Text('Checkout')),
              OutlinedButton(onPressed: () {}, child: const Text('Cancel')),
              TextButton(onPressed: () {}, child: const Text('Details')),
            ],
          ),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(hintText: 'Scan IMEI…'),
          ),
          const SizedBox(height: 24),
          Text('Status', style: t.titleMedium),
          const SizedBox(height: 12),
          const Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _StatusChip('In stock', AppColors.success),
              _StatusChip('Low stock', AppColors.warning),
              _StatusChip('Returned', AppColors.danger),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip(this.label, this.color);

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

class _ColorRow extends StatelessWidget {
  const _ColorRow();

  @override
  Widget build(BuildContext context) {
    // The admin panel's real working palette: neutrals + semantic, not brand.
    const swatches = <(String, Color)>[
      ('ink', AppColors.inkBlack),
      ('slate', AppColors.slate),
      ('bone', AppColors.bone),
      ('mist', AppColors.mist),
      ('canvas', AppColors.surfaceCanvas),
      ('danger', AppColors.destructive),
    ];
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        for (final (label, color) in swatches)
          Column(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(AppRadii.cards),
                  border: Border.all(color: AppColors.bone),
                ),
              ),
              const SizedBox(height: 4),
              Text(label, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
      ],
    );
  }
}
