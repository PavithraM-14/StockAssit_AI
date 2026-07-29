import 'package:flutter/material.dart';
import '../../domain/signal_model.dart';

/// Signal Card Widget
/// Shows BUY/SELL/HOLD badge + confidence in a card

class SignalCard extends StatelessWidget {
  final SignalModel signal;
  final VoidCallback? onTap;

  const SignalCard({
    Key? key,
    required this.signal,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    signal.symbol,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  _buildSignalBadge(),
                ],
              ),
              const SizedBox(height: 12),
              _buildConfidenceBar(),
              const SizedBox(height: 8),
              Text(
                signal.reasoning,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _formatTime(signal.generatedAt),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSignalBadge() {
    Color color;
    IconData icon;
    String label;

    switch (signal.signal) {
      case SignalType.buy:
        color = Colors.green;
        icon = Icons.trending_up;
        label = 'BUY';
        break;
      case SignalType.sell:
        color = Colors.red;
        icon = Icons.trending_down;
        label = 'SELL';
        break;
      case SignalType.hold:
        color = Colors.orange;
        icon = Icons.remove;
        label = 'HOLD';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfidenceBar() {
    return Row(
      children: [
        Expanded(
          child: LinearProgressIndicator(
            value: signal.confidence / 100,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(_getConfidenceColor()),
            minHeight: 8,
          ),
        ),
        const SizedBox(width: 12),
        Text(
          '${signal.confidence}%',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Color _getConfidenceColor() {
    if (signal.confidence >= 80) return Colors.green;
    if (signal.confidence >= 60) return Colors.lightGreen;
    if (signal.confidence >= 40) return Colors.orange;
    return Colors.red;
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}
