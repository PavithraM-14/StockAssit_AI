import 'package:flutter/material.dart';

/// Signal Badge Widget
/// Small buy/sell/hold indicator shown on stock detail page

enum BadgeSignalType { buy, sell, hold }

class SignalBadge extends StatelessWidget {
  final BadgeSignalType signal;
  final int? confidence;
  final bool showConfidence;
  final double size;

  const SignalBadge({
    Key? key,
    required this.signal,
    this.confidence,
    this.showConfidence = true,
    this.size = 1.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: 8 * size,
        vertical: 4 * size,
      ),
      decoration: BoxDecoration(
        color: _getColor(),
        borderRadius: BorderRadius.circular(12 * size),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getIcon(),
            color: Colors.white,
            size: 14 * size,
          ),
          SizedBox(width: 4 * size),
          Text(
            _getLabel(),
            style: TextStyle(
              color: Colors.white,
              fontSize: 12 * size,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (showConfidence && confidence != null) ...[
            SizedBox(width: 4 * size),
            Text(
              '${confidence}%',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 11 * size,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getColor() {
    switch (signal) {
      case BadgeSignalType.buy:
        return Colors.green;
      case BadgeSignalType.sell:
        return Colors.red;
      case BadgeSignalType.hold:
        return Colors.orange;
    }
  }

  IconData _getIcon() {
    switch (signal) {
      case BadgeSignalType.buy:
        return Icons.trending_up;
      case BadgeSignalType.sell:
        return Icons.trending_down;
      case BadgeSignalType.hold:
        return Icons.remove;
    }
  }

  String _getLabel() {
    switch (signal) {
      case BadgeSignalType.buy:
        return 'BUY';
      case BadgeSignalType.sell:
        return 'SELL';
      case BadgeSignalType.hold:
        return 'HOLD';
    }
  }
}

/// Signal Badge from Model (convenience widget)
class SignalBadgeFromModel extends StatelessWidget {
  final String signalType; // 'BUY', 'SELL', 'HOLD'
  final int? confidence;
  final bool showConfidence;
  final double size;

  const SignalBadgeFromModel({
    Key? key,
    required this.signalType,
    this.confidence,
    this.showConfidence = true,
    this.size = 1.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SignalBadge(
      signal: _parseSignalType(signalType),
      confidence: confidence,
      showConfidence: showConfidence,
      size: size,
    );
  }

  BadgeSignalType _parseSignalType(String type) {
    switch (type.toUpperCase()) {
      case 'BUY':
        return BadgeSignalType.buy;
      case 'SELL':
        return BadgeSignalType.sell;
      default:
        return BadgeSignalType.hold;
    }
  }
}
