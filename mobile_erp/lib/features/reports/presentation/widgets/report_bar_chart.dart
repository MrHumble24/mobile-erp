import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../../shared/ui/ui.dart';

/// One labelled bar value.
typedef BarDatum = ({String label, double value});

/// A compact fl_chart bar chart inside an [AppCard], used by the report tabs.
/// Labels render under each bar; the tallest bar sets the scale.
class ReportBarChart extends StatelessWidget {
  const ReportBarChart({
    required this.title,
    required this.data,
    this.height = 240,
    super.key,
  });

  final String title;
  final List<BarDatum> data;
  final double height;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final maxY = data.fold<double>(0, (m, d) => d.value > m ? d.value : m);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: text.labelLarge),
          const SizedBox(height: 16),
          SizedBox(
            height: height,
            child: data.isEmpty
                ? Center(child: Text('—', style: text.bodyMedium))
                : BarChart(
                    BarChartData(
                      maxY: maxY == 0 ? 1 : maxY * 1.15,
                      alignment: BarChartAlignment.spaceAround,
                      gridData: const FlGridData(show: true, drawVerticalLine: false),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        leftTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 34,
                            getTitlesWidget: (value, meta) {
                              final i = value.toInt();
                              if (i < 0 || i >= data.length) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  data[i].label,
                                  style: text.bodySmall,
                                  textAlign: TextAlign.center,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      barGroups: [
                        for (var i = 0; i < data.length; i++)
                          BarChartGroupData(
                            x: i,
                            barRods: [
                              BarChartRodData(
                                toY: data[i].value,
                                color: scheme.primary,
                                width: 18,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
