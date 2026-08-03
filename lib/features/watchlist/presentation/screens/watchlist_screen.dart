import 'package:flutter/material.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../stock_detail/widgets/signal_badge.dart';
import '../../../signals/data/signal_repository.dart';
import '../../../signals/domain/signal_model.dart';
import '../../data/watchlist_repository.dart';
import '../../domain/watchlist_model.dart';

/// Watchlist Screen
/// Displays and manages the user's tracked tickers with current price and signals
class WatchlistScreen extends StatefulWidget {
  final WatchlistRepository? repository;
  final SignalRepository? signalRepository;

  const WatchlistScreen({
    super.key,
    this.repository,
    this.signalRepository,
  });

  @override
  State<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends State<WatchlistScreen> {
  late final WatchlistRepository _repository;
  late final SignalRepository _signalRepository;
  WatchlistModel? _watchlist;
  bool _isLoading = true;
  String? _errorMessage;
  
  // Cache signals for quick display
  final Map<String, SignalModel> _signals = {};

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? WatchlistRepository();
    _signalRepository = widget.signalRepository ?? SignalRepository();
    _fetchWatchlist();
  }

  Future<void> _fetchWatchlist() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final watchlist = await _repository.getWatchlist();
      if (mounted) {
        setState(() {
          _watchlist = watchlist;
          _isLoading = false;
        });
        // Fetch signals for all tickers in background
        _fetchSignalsForTickers(watchlist.tickers);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  /// Fetch signals for all tickers (background operation)
  Future<void> _fetchSignalsForTickers(List<String> tickers) async {
    for (final ticker in tickers) {
      try {
        final signal = await _signalRepository.getSignalForTicker(ticker);
        if (mounted) {
          setState(() {
            _signals[ticker] = signal;
          });
        }
      } catch (e) {
        // Silently fail for individual signals - they're not critical
        debugPrint('Failed to fetch signal for $ticker: $e');
      }
    }
  }

  Future<void> _addTicker(String ticker) async {
    try {
      final updated = await _repository.addTicker(ticker);
      if (mounted) {
        setState(() => _watchlist = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$ticker added to watchlist'),
            backgroundColor: Colors.green,
          ),
        );
        // Fetch signal for new ticker
        _fetchSignalsForTickers([ticker]);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _removeTicker(String ticker) async {
    try {
      final updated = await _repository.removeTicker(ticker);
      if (mounted) {
        setState(() {
          _watchlist = updated;
          _signals.remove(ticker); // Remove cached signal
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$ticker removed from watchlist')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showAddTickerDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Add to Watchlist'),
        content: TextField(
          controller: controller,
          textCapitalization: TextCapitalization.characters,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Ticker Symbol',
            hintText: 'e.g. AAPL, TSLA, GOOGL',
            prefixIcon: Icon(Icons.search),
          ),
          onSubmitted: (val) {
            if (val.trim().isNotEmpty) {
              Navigator.pop(dialogCtx);
              _addTicker(val.trim().toUpperCase());
            }
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final val = controller.text.trim();
              if (val.isNotEmpty) {
                Navigator.pop(dialogCtx);
                _addTicker(val.toUpperCase());
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Watchlist'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchWatchlist,
            tooltip: 'Refresh',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddTickerDialog,
        icon: const Icon(Icons.add),
        label: const Text('Add Ticker'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingIndicator(message: 'Loading watchlist...');
    }

    if (_errorMessage != null) {
      return ErrorView(message: _errorMessage!, onRetry: _fetchWatchlist);
    }

    final tickers = _watchlist?.tickers ?? [];

    if (tickers.isEmpty) {
      return EmptyState(
        icon: Icons.bookmark_border_outlined,
        title: 'Your Watchlist is Empty',
        message: 'Add stocks you want to track and receive AI-powered signals for.',
        action: ElevatedButton.icon(
          onPressed: _showAddTickerDialog,
          icon: const Icon(Icons.add),
          label: const Text('Add Your First Stock'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchWatchlist,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: tickers.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final ticker = tickers[index];
          final signal = _signals[ticker];
          
          return Dismissible(
            key: Key(ticker),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.delete_outline,
                color: Colors.white,
                size: 32,
              ),
            ),
            confirmDismiss: (direction) async {
              return await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Remove Ticker?'),
                  content: Text('Remove $ticker from your watchlist?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Remove', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
              ) ?? false;
            },
            onDismissed: (_) => _removeTicker(ticker),
            child: Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: InkWell(
                onTap: () {
                  // Navigate to stock detail
                  Navigator.pushNamed(
                    context,
                    '/stock-detail',
                    arguments: ticker,
                  );
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      // Ticker Symbol
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                        child: Text(
                          ticker.isNotEmpty ? ticker[0] : '?',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                            color: Theme.of(context).primaryColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      
                      // Ticker Name & Signal
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ticker,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (signal != null)
                              SignalBadgeFromModel(
                                signalType: signal.signal.name.toUpperCase(),
                                confidence: signal.confidence,
                                showConfidence: true,
                                size: 0.9,
                              )
                            else
                              Text(
                                'Loading signal...',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[500],
                                ),
                              ),
                          ],
                        ),
                      ),
                      
                      // View Details Arrow
                      Icon(
                        Icons.chevron_right,
                        color: Colors.grey[400],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
