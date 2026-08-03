import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../data/signal_repository.dart';
import '../../domain/signal_model.dart';
import '../widgets/disclaimer_banner.dart';
import '../widgets/indicator_breakdown.dart';

/// Signal Detail Screen
/// Displays in-depth analysis, confidence score, AI reasoning, and indicator breakdown
class SignalDetailScreen extends StatefulWidget {
  final String? ticker;
  final SignalModel? signal;
  final SignalRepository? repository;

  const SignalDetailScreen({
    super.key,
    this.ticker,
    this.signal,
    this.repository,
  });

  @override
  State<SignalDetailScreen> createState() => _SignalDetailScreenState();
}

class _SignalDetailScreenState extends State<SignalDetailScreen> {
  late final SignalRepository _repository;
  SignalModel? _signal;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? SignalRepository();
    if (widget.signal != null) {
      _signal = widget.signal;
      _isInitialized = true;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      _isInitialized = true;
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is SignalModel) {
        _signal = args;
      } else if (args is String && args.isNotEmpty) {
        _fetchSignal(args);
      } else if (widget.ticker != null && widget.ticker!.isNotEmpty) {
        _fetchSignal(widget.ticker!);
      }
    }
  }

  Future<void> _fetchSignal(String ticker) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final fetchedSignal = await _repository.getSignal(ticker);
      if (mounted) {
        setState(() {
          _signal = fetchedSignal;
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
    final tickerName = _signal?.symbol ?? widget.ticker ?? 'Stock';

    return Scaffold(
      appBar: AppBar(
        title: Text('$tickerName Signal Analysis'),
      ),
      body: Column(
        children: [
          // Pinned Disclaimer Banner (Always visible)
          const DisclaimerBanner(),

          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const LoadingIndicator(
        message: 'Fetching detailed signal analysis...',
      );
    }

    if (_errorMessage != null) {
      return ErrorView(
        message: _errorMessage!,
        onRetry: () {
          final args = ModalRoute.of(context)?.settings.arguments;
          final ticker = args is String ? args : (widget.ticker ?? '');
          if (ticker.isNotEmpty) _fetchSignal(ticker);
        },
      );
    }

    if (_signal == null) {
      return const Center(child: Text('No signal details available.'));
    }

    final signal = _signal!;
    final signalColor = AppTheme.getSignalColor(signal.signal.name);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card with Ticker, Signal Badge & Confidence Score
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    signal.symbol,
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const SizedBox(height: 12),
                  
                  // Signal Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                    decoration: BoxDecoration(
                      color: signalColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      signal.signal.name.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Confidence Score & Bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Confidence Score: ',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        '${signal.confidence}% (${signal.confidenceLevel})',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: signalColor,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: signal.confidence / 100,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation<Color>(signalColor),
                      minHeight: 8,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // AI Explanation Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: Colors.blue),
                      const SizedBox(width: 8),
                      Text(
                        'AI Analysis & Reasoning',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    signal.reasoning.isNotEmpty
                        ? signal.reasoning
                        : 'No detailed AI explanation available for this signal.',
                    style: const TextStyle(fontSize: 15, height: 1.5),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Indicator Breakdown Widget
          IndicatorBreakdown(indicators: signal.indicators),
        ],
      ),
    );
  }
}
