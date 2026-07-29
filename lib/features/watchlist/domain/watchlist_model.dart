/// Watchlist Model
class WatchlistModel {
  final String userId;
  final List<String> tickers;
  final DateTime? updatedAt;

  WatchlistModel({
    required this.userId,
    required this.tickers,
    this.updatedAt,
  });

  factory WatchlistModel.fromJson(Map<String, dynamic> json) {
    return WatchlistModel(
      userId: json['userId'] ?? '',
      // Support both 'tickers' (backend field) and 'symbols' (legacy field)
      tickers: List<String>.from(json['tickers'] ?? json['symbols'] ?? []),
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'tickers': tickers,
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}
