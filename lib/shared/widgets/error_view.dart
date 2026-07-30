import 'package:flutter/material.dart';

/// Error View Widget
/// Shows error message with retry button
class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorView({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            SizedBox(height: 16),
            Text(
              'Oops! Something went wrong',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 8),
            Text(
              message,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: Icon(Icons.refresh),
                label: Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
