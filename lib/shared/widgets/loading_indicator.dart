import 'package:flutter/material.dart';

/// Loading Indicator Widget
/// Shows a centered circular progress indicator with optional message
class LoadingIndicator extends StatelessWidget {
  final String? message;
  final double size;

  const LoadingIndicator({
    Key? key,
    this.message,
    this.size = 36.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              strokeWidth: 3,
            ),
          ),
          if (message != null) ...[
            SizedBox(height: 16),
            Text(
              message!,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}
