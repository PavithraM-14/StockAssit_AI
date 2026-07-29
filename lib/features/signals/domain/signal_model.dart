/// Signal Model
/// Represents a trading signal (BUY/SELL/HOLD) for a stock

class SignalModel {
  final String symbol;
  final SignalType signal;
  final int confidence; // 0-100
  final SignalIndicators indicators;
  final String reasoning;
  final DateTime generatedAt;
  final String disclaimer;

  SignalModel({
    required this.symbol,
    required this.signal,
    required this.confidence,
    required this.indicators,
    required this.reasoning,
    required this.generatedAt,
    this.disclaimer = 'Not financial advice. For educational purposes only.',
  });

  factory SignalModel.fromJson(Map<String, dynamic> json) {
    return SignalModel(
      symbol: json['symbol'] ?? '',
      signal: _parseSignalType(json['signal']),
      confidence: json['confidence'] ?? 0,
      indicators: SignalIndicators.fromJson(json['indicators'] ?? {}),
      reasoning: json['reasoning'] ?? '',
      generatedAt: DateTime.parse(json['generatedAt'] ?? DateTime.now().toIso8601String()),
      disclaimer: json['disclaimer'] ?? 'Not financial advice. For educational purposes only.',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'signal': signal.name.toUpperCase(),
      'confidence': confidence,
      'indicators': indicators.toJson(),
      'reasoning': reasoning,
      'generatedAt': generatedAt.toIso8601String(),
      'disclaimer': disclaimer,
    };
  }

  static SignalType _parseSignalType(String? value) {
    switch (value?.toUpperCase()) {
      case 'BUY':
        return SignalType.buy;
      case 'SELL':
        return SignalType.sell;
      default:
        return SignalType.hold;
    }
  }

  String get confidenceLevel {
    if (confidence >= 80) return 'Very High';
    if (confidence >= 60) return 'High';
    if (confidence >= 40) return 'Moderate';
    return 'Low';
  }
}

enum SignalType {
  buy,
  sell,
  hold,
}

class SignalIndicators {
  final Map<String, dynamic> technical;
  final Map<String, dynamic> fundamental;
  final Map<String, dynamic> sentiment;

  SignalIndicators({
    required this.technical,
    required this.fundamental,
    required this.sentiment,
  });

  factory SignalIndicators.fromJson(Map<String, dynamic> json) {
    return SignalIndicators(
      technical: Map<String, dynamic>.from(json['technical'] ?? {}),
      fundamental: Map<String, dynamic>.from(json['fundamental'] ?? {}),
      sentiment: Map<String, dynamic>.from(json['sentiment'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'technical': technical,
      'fundamental': fundamental,
      'sentiment': sentiment,
    };
  }
}
