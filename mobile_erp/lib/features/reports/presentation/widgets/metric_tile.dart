import 'package:flutter/material.dart';

import '../../../../shared/ui/ui.dart';

/// A labelled figure card used across the report tabs (revenue, profit, …).
/// [emphasis] tints the value (e.g. expenses / refunds in the danger colour).
class MetricTile extends StatelessWidget {
  const MetricTile({
    required this.label,
    required this.value,
    this.subtext,
    this.emphasis,
    super.key,
  });

  final String label;
  final String value;
  final String? subtext;
  final Color? emphasis;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final muted = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: text.labelMedium?.copyWith(color: muted)),
          const SizedBox(height: 6),
          Text(value, style: text.titleLarge?.copyWith(color: emphasis)),
          if (subtext != null) ...[
            const SizedBox(height: 4),
            Text(subtext!, style: text.bodySmall?.copyWith(color: muted)),
          ],
        ],
      ),
    );
  }
}

/// Lays metric tiles out in a responsive wrap (≈2 per row on phones).
class MetricGrid extends StatelessWidget {
  const MetricGrid({required this.tiles, super.key});

  final List<Widget> tiles;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final perRow = width >= 900 ? 4 : (width >= 560 ? 3 : 2);
    final tileWidth = (width - 32 - (perRow - 1) * 12) / perRow;
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        for (final tile in tiles)
          SizedBox(width: tileWidth.clamp(120, 320).toDouble(), child: tile),
      ],
    );
  }
}
