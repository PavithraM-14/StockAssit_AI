/// Alert Model
/// Represents a price/signal alert set by the user
class AlertModel {
  final String id;
  final String ticker;
  final String condition;   // price_above | price_below | volume_spike | signal_change
  final double threshold;
  final bool isActive;
  final DateTime? createdAt;

  AlertModel({
    required this.id,
    required this.ticker,
    required this.condition,
    required this.threshold,
    required this.isActive,
    this.createdAt,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
      id: json['_id'] ?? json['id'] ?? '',
      ticker: json['ticker'] ?? '',
      condition: json['condition'] ?? '',
      threshold: (json['threshold'] as num?)?.toDouble() ?? 0.0,
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'ticker': ticker,
    'condition': condition,
    'threshold': threshold,
    'isActive': isActive,
  };

  AlertModel copyWith({bool? isActive, double? threshold}) {
    return AlertModel(
      id: id,
      ticker: ticker,
      condition: condition,
      threshold: threshold ?? this.threshold,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt,
    );
  }

  /// Human-readable condition label
  String get conditionLabel {
    switch (condition.toLowerCase()) {
      case 'price_above': return 'Price Above \$${threshold.toStringAsFixed(2)}';
      case 'price_below': return 'Price Below \$${threshold.toStringAsFixed(2)}';
      case 'volume_spike': return 'Volume Spike';
      case 'signal_change': return 'Signal Change';
      default: return condition;
    }
  }
}
