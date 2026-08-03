/// Holding Model
/// Represents a stock position tracked by the user in their portfolio
library;

class HoldingModel {
  final String id;
  final String ticker;
  final double quantity;
  final double avgBuyPrice;
  final DateTime purchaseDate;
  final String notes;

  HoldingModel({
    required this.id,
    required this.ticker,
    required this.quantity,
    required this.avgBuyPrice,
    required this.purchaseDate,
    this.notes = '',
  });

  /// Total invested amount (quantity * avgBuyPrice)
  double get totalInvested => quantity * avgBuyPrice;

  /// Current market value given the current stock price
  double currentValue(double currentPrice) => quantity * currentPrice;

  /// Currency gain or loss given the current stock price
  double gainLoss(double currentPrice) => currentValue(currentPrice) - totalInvested;

  /// Percentage gain or loss given the current stock price
  double gainLossPercentage(double currentPrice) {
    if (totalInvested <= 0) return 0.0;
    return (gainLoss(currentPrice) / totalInvested) * 100;
  }

  factory HoldingModel.fromJson(Map<String, dynamic> json) {
    return HoldingModel(
      id: json['_id'] ?? json['id'] ?? '',
      ticker: json['ticker'] ?? '',
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0.0,
      avgBuyPrice: (json['avgBuyPrice'] as num?)?.toDouble() ?? 0.0,
      purchaseDate: json['purchaseDate'] != null
          ? DateTime.parse(json['purchaseDate'])
          : DateTime.now(),
      notes: json['notes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticker': ticker,
      'quantity': quantity,
      'avgBuyPrice': avgBuyPrice,
      'purchaseDate': purchaseDate.toIso8601String(),
      'notes': notes,
    };
  }

  HoldingModel copyWith({
    String? id,
    String? ticker,
    double? quantity,
    double? avgBuyPrice,
    DateTime? purchaseDate,
    String? notes,
  }) {
    return HoldingModel(
      id: id ?? this.id,
      ticker: ticker ?? this.ticker,
      quantity: quantity ?? this.quantity,
      avgBuyPrice: avgBuyPrice ?? this.avgBuyPrice,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      notes: notes ?? this.notes,
    );
  }
}
