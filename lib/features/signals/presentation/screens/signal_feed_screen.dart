import 'package:flutter/material.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../data/signal_repository.dart';
import '../../domain/signal_model.dart';
import '../widgets/disclaimer_banner.dart';
import '../widgets/signal_card.dart';

/// Signal Feed Screen
/// Displays today's signals for tracked stocks in the user's watchlist
class SignalFeedScreen extends StatefulWidget {
  final SignalRepository? repository;

  const SignalFeedScreen({
    Key? key,
    this.repository,
  }) : super(key: key);

  @override
  State<SignalFeedScreen> createState() => _SignalFeedScreenState();
}

class _SignalFeedScreenState extends State<SignalFeedScreen> {
  late final SignalRepository _repository;
  List<SignalModel> _signals = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? SignalRepository();
    _fetchSignals();
  }

  Future<void> _fetchSignals() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final signals = await _repository.getWatchlistSignals();
      if (mounted) {
        setState(() {
          _signals = signals;
          _isLoading = false;
        });
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Today's Signals"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchSignals,
            tooltip: 'Refresh Signals',
          ),
        ],
      ),
      body: Column(
        children: [
          // Pinned Disclaimer Banner (Always visible at top of screen)
          const DisclaimerBanner(),

          // Dynamic Body Content (Loading, Error, Empty, or List)
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingIndicator(
        message: 'Analyzing market data & generating signals...',
      );
    }

    if (_errorMessage != null) {
      return ErrorView(
        message: _errorMessage!,
        onRetry: _fetchSignals,
      );
    }

    if (_signals.isEmpty) {
      return EmptyState(
        icon: Icons.notifications_none_outlined,
        title: 'No Signals Available',
        message: 'Your watchlist is empty or has no active signals.\nAdd stocks to your watchlist to track signals.',
        action: ElevatedButton.icon(
          onPressed: () {
            Navigator.pushNamed(context, '/watchlist');
          },
          icon: const Icon(Icons.add),
          label: const Text('Manage Watchlist'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchSignals,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _signals.length,
        itemBuilder: (context, index) {
          final signal = _signals[index];
          return SignalCard(
            signal: signal,
            onTap: () {
              Navigator.pushNamed(
                context,
                '/signal-detail',
                arguments: signal,
              );
            },
          );
        },
      ),
    );
  }
}
