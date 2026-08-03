import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../data/holdings_repository.dart';
import '../../domain/holding_model.dart';
import '../widgets/holding_card.dart';

/// Holdings Screen
/// Displays user's tracked stock holdings with portfolio performance summaries & add/edit/delete capabilities
class HoldingsScreen extends StatefulWidget {
  final HoldingsRepository? repository;

  const HoldingsScreen({
    super.key,
    this.repository,
  });

  @override
  State<HoldingsScreen> createState() => _HoldingsScreenState();
}

class _HoldingsScreenState extends State<HoldingsScreen> {
  late final HoldingsRepository _repository;
  List<HoldingModel> _holdings = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? HoldingsRepository();
    _fetchHoldings();
  }

  Future<void> _fetchHoldings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final holdings = await _repository.getHoldings();
      if (mounted) {
        setState(() {
          _holdings = holdings;
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

  Future<void> _deleteHolding(String id) async {
    try {
      await _repository.deleteHolding(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Holding deleted successfully')),
        );
        _fetchHoldings();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete holding: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showAddEditDialog([HoldingModel? holding]) {
    final isEditing = holding != null;
    final tickerController = TextEditingController(text: holding?.ticker ?? '');
    final quantityController = TextEditingController(text: holding?.quantity.toString() ?? '');
    final priceController = TextEditingController(text: holding?.avgBuyPrice.toString() ?? '');
    final notesController = TextEditingController(text: holding?.notes ?? '');
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(isEditing ? 'Edit Holding (${holding.ticker})' : 'Add New Holding'),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!isEditing)
                    TextFormField(
                      controller: tickerController,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(
                        labelText: 'Ticker Symbol',
                        hintText: 'e.g., AAPL, GOOGL',
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Please enter a ticker symbol.';
                        }
                        if (!RegExp(r'^[A-Z]{1,5}$').hasMatch(val.trim().toUpperCase())) {
                          return 'Enter 1-5 uppercase letters.';
                        }
                        return null;
                      },
                    ),
                  if (!isEditing) const SizedBox(height: 12),
                  TextFormField(
                    controller: quantityController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Quantity (Shares)',
                      hintText: '10',
                    ),
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'Please enter quantity.';
                      final numVal = double.tryParse(val);
                      if (numVal == null || numVal <= 0) return 'Must be a positive number.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: priceController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Average Buy Price (\$)',
                      hintText: '150.00',
                    ),
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'Please enter buy price.';
                      final numVal = double.tryParse(val);
                      if (numVal == null || numVal <= 0) return 'Must be a positive number.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes (Optional)',
                      hintText: 'Long-term investment',
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                Navigator.pop(dialogContext);

                try {
                  if (isEditing) {
                    await _repository.updateHolding(
                      holding.id,
                      quantity: double.parse(quantityController.text),
                      avgBuyPrice: double.parse(priceController.text),
                      notes: notesController.text.trim(),
                    );
                  } else {
                    await _repository.addHolding(
                      ticker: tickerController.text.trim().toUpperCase(),
                      quantity: double.parse(quantityController.text),
                      avgBuyPrice: double.parse(priceController.text),
                      notes: notesController.text.trim(),
                    );
                  }

                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(isEditing ? 'Holding updated' : 'Holding added'),
                      ),
                    );
                    _fetchHoldings();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              child: Text(isEditing ? 'Save Changes' : 'Add Holding'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Calculate Portfolio Summaries
    final totalInvested = _holdings.fold<double>(0.0, (sum, item) => sum + item.totalInvested);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tracked Holdings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchHoldings,
            tooltip: 'Refresh Portfolio',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEditDialog(),
        icon: const Icon(Icons.add),
        label: const Text('Add Holding'),
      ),
      body: _buildBody(totalInvested),
    );
  }

  Widget _buildBody(double totalInvested) {
    if (_isLoading) {
      return const LoadingIndicator(message: 'Loading portfolio holdings...');
    }

    if (_errorMessage != null) {
      return ErrorView(
        message: _errorMessage!,
        onRetry: _fetchHoldings,
      );
    }

    if (_holdings.isEmpty) {
      return EmptyState(
        icon: Icons.account_balance_wallet_outlined,
        title: 'No Tracked Holdings',
        message: 'You have not added any stock holdings to track yet.\nTap below to add your first position.',
        action: ElevatedButton.icon(
          onPressed: () => _showAddEditDialog(),
          icon: const Icon(Icons.add),
          label: const Text('Add Your First Holding'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchHoldings,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Portfolio Summary Header Card
          Card(
            color: Theme.of(context).primaryColor,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Total Portfolio Invested',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '\$${totalInvested.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.shield_outlined, color: Colors.white70, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '${_holdings.length} tracked positions (Portfolio tracking only - non-execution)',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          Text(
            'Your Positions',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),

          // List of Holdings
          ..._holdings.map((holding) {
            return HoldingCard(
              holding: holding,
              onEdit: () => _showAddEditDialog(holding),
              onDelete: () => _confirmDelete(holding),
            );
          }),
        ],
      ),
    );
  }

  void _confirmDelete(HoldingModel holding) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text('Delete ${holding.ticker}?'),
          content: Text('Are you sure you want to remove ${holding.quantity} shares of ${holding.ticker} from your portfolio tracking?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () {
                Navigator.pop(dialogContext);
                _deleteHolding(holding.id);
              },
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }
}
