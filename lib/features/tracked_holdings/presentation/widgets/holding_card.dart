import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/holding_model.dart';

/// Holding Card Widget
/// Displays a summary of a single tracked holding position with gain/loss calculations
class HoldingCard extends StatelessWidget {
  final HoldingModel holding;
  final double? currentPrice;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const HoldingCard({
    Key? key,
    required this.holding,
    this.currentPrice,
    this.onEdit,
    this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // If current market price is unavailable, default to average buy price (0% gain/loss)
    final price = currentPrice ?? holding.avgBuyPrice;
    final gainLossAmount = holding.gainLoss(price);
    final gainLossPercent = holding.gainLossPercentage(price);
    final isPositive = gainLossAmount >= 0;
    final gainColor = isPositive ? AppTheme.buyColor : AppTheme.sellColor;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Ticker & Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                      child: Text(
                        holding.ticker.isNotEmpty ? holding.ticker[0] : 'S',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          holding.ticker,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '${holding.quantity.toStringAsFixed(holding.quantity.truncateToDouble() == holding.quantity ? 0 : 2)} shares',
                          style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ],
                ),

                // Edit & Delete Action Buttons
                Row(
                  children: [
                    if (onEdit != null)
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 20),
                        onPressed: onEdit,
                        tooltip: 'Edit Holding',
                      ),
                    if (onDelete != null)
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                        onPressed: onDelete,
                        tooltip: 'Delete Holding',
                      ),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),

            // Bottom Metrics Grid
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Avg Buy Price & Total Invested
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Avg Buy Price',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '\$${holding.avgBuyPrice.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Total Invested',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '\$${holding.totalInvested.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),

                // Current Price & Value
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Current Value',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '\$${holding.currentValue(price).toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),

                    // Gain / Loss Tag
                    Text(
                      'Gain / Loss',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          isPositive ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                          color: gainColor,
                          size: 18,
                        ),
                        Text(
                          '${isPositive ? '+' : ''}\$${gainLossAmount.abs().toStringAsFixed(2)} (${gainLossPercent.toStringAsFixed(2)}%)',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: gainColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
