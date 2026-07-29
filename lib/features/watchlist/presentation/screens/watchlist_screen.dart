import 'package:flutter/material.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../data/watchlist_repository.dart';
import '../../domain/watchlist_model.dart';

/// Watchlist Screen
/// Displays and manages the user's tracked tickers
class WatchlistScreen extends StatefulWidget {
  final WatchlistRepository? repository;

  const WatchlistScreen({Key? key, this.repository}) : super(key: key);

  @override
  State<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends State<WatchlistScreen> {
  late final WatchlistRepository _repository;
  WatchlistModel? _watchlist;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? WatchlistRepository();
    _fetchWatchlist();
  }

  Future<void> _fetchWatchlist() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final watchlist = await _repository.getWatchlist();
      if (mounted) setState(() { _watchlist = watchlist; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _errorMessage = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _addTicker(String ticker) async {
    try {
      final updated = await _repository.addTicker(ticker);
      if (mounted) setState(() => _watchlist = updated);
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
      if (mounted) setState(() => _watchlist = updated);
      if (mounted) {
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
          decoration: const InputDecoration(
            labelText: 'Ticker Symbol',
            hintText: 'e.g. AAPL, TSLA, GOOGL',
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
    if (_isLoading) return const LoadingIndicator(message: 'Loading watchlist...');

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
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(
                  ticker.isNotEmpty ? ticker[0] : '?',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(ticker, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.candlestick_chart_outlined),
                    tooltip: 'View Signal',
                    onPressed: () => Navigator.pushNamed(context, '/signal-detail', arguments: ticker),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    tooltip: 'Remove',
                    onPressed: () => _removeTicker(ticker),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
