import 'package:flutter/material.dart';
import '../../domain/signal_model.dart';

/// Indicator Breakdown Widget
/// Shows which indicators triggered the signal

class IndicatorBreakdown extends StatelessWidget {
  final SignalIndicators indicators;

  const IndicatorBreakdown({
    super.key,
    required this.indicators,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Indicator Breakdown',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildSection('Technical Indicators', indicators.technical, Icons.show_chart),
          const SizedBox(height: 16),
          _buildSection('Fundamental Indicators', indicators.fundamental, Icons.account_balance),
          const SizedBox(height: 16),
          _buildSection('Sentiment Indicators', indicators.sentiment, Icons.sentiment_satisfied),
        ],
      ),
    );
  }

  Widget _buildSection(String title, Map<String, dynamic> data, IconData icon) {
    if (data.isEmpty) {
      return _buildSectionHeader(title, icon);
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...data.entries.map((entry) => _buildIndicatorRow(entry.key, entry.value)),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildIndicatorRow(String name, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            _formatIndicatorName(name),
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
            ),
          ),
          Text(
            _formatIndicatorValue(value),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatIndicatorName(String name) {
    // Convert camelCase to Title Case
    return name
        .replaceAllMapped(RegExp(r'([A-Z])'), (match) => ' ${match.group(0)}')
        .trim()
        .split(' ')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }

  String _formatIndicatorValue(dynamic value) {
    if (value is num) {
      return value.toStringAsFixed(2);
    }
    return value.toString();
  }
}
