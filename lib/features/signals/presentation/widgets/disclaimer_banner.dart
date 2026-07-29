import 'package:flutter/material.dart';

/// Disclaimer Banner Widget
/// "Not financial advice" - shown on every signal screen

class DisclaimerBanner extends StatelessWidget {
  final String? customText;

  const DisclaimerBanner({
    Key? key,
    this.customText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber[100],
        border: Border(
          bottom: BorderSide(
            color: Colors.amber[300]!,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            color: Colors.amber[900],
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              customText ?? 
              'Not financial advice. Signals are for educational purposes only. '
              'Always do your own research before investing.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.amber[900],
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact Disclaimer Widget for smaller spaces
class DisclaimerText extends StatelessWidget {
  const DisclaimerText({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Text(
      '⚠️ Not financial advice',
      style: TextStyle(
        fontSize: 11,
        color: Colors.grey[600],
        fontStyle: FontStyle.italic,
      ),
    );
  }
}
