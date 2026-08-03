import 'package:flutter/material.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../data/alerts_repository.dart';
import '../../domain/alert_model.dart';

/// Alerts Screen — list, create, toggle, and delete price/signal alerts
class AlertsScreen extends StatefulWidget {
  final AlertsRepository? repository;

  const AlertsScreen({super.key, this.repository});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  late final AlertsRepository _repository;
  List<AlertModel> _alerts = [];
  bool _isLoading = true;
  String? _errorMessage;

  static const List<String> _conditions = [
    'price_above',
    'price_below',
    'volume_spike',
    'signal_change',
  ];

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? AlertsRepository();
    _fetchAlerts();
  }

  Future<void> _fetchAlerts() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      final alerts = await _repository.getAlerts();
      if (mounted) setState(() { _alerts = alerts; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _errorMessage = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _toggleAlert(AlertModel alert) async {
    try {
      final updated = await _repository.updateAlert(alert.id, isActive: !alert.isActive);
      if (mounted) {
        setState(() {
          final idx = _alerts.indexWhere((a) => a.id == updated.id);
          if (idx != -1) _alerts[idx] = updated;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Toggle failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _deleteAlert(String id) async {
    try {
      await _repository.deleteAlert(id);
      if (mounted) setState(() => _alerts.removeWhere((a) => a.id == id));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Delete failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showCreateDialog() {
    final tickerCtrl = TextEditingController();
    final thresholdCtrl = TextEditingController();
    String selectedCondition = _conditions.first;
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Alert'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: tickerCtrl,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(labelText: 'Ticker Symbol', hintText: 'AAPL'),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Required';
                    if (!RegExp(r'^[A-Z]{1,5}$').hasMatch(v.trim().toUpperCase())) return '1-5 letters';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: selectedCondition,
                  decoration: const InputDecoration(labelText: 'Condition'),
                  items: _conditions
                      .map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' '))))
                      .toList(),
                  onChanged: (val) => setDialogState(() => selectedCondition = val!),
                ),
                const SizedBox(height: 12),
                if (selectedCondition == 'price_above' || selectedCondition == 'price_below')
                  TextFormField(
                    controller: thresholdCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Price Threshold (\$)', hintText: '150.00'),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required for price alerts';
                      if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Enter a valid price';
                      return null;
                    },
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                Navigator.pop(ctx);
                try {
                  final alert = await _repository.createAlert(
                    ticker: tickerCtrl.text.trim().toUpperCase(),
                    condition: selectedCondition,
                    threshold: double.tryParse(thresholdCtrl.text) ?? 0.0,
                  );
                  if (mounted) setState(() => _alerts.insert(0, alert));
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              child: const Text('Create Alert'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Alerts'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchAlerts),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
        icon: const Icon(Icons.add_alert),
        label: const Text('New Alert'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const LoadingIndicator(message: 'Loading alerts...');
    if (_errorMessage != null) return ErrorView(message: _errorMessage!, onRetry: _fetchAlerts);
    if (_alerts.isEmpty) {
      return EmptyState(
        icon: Icons.notifications_none_outlined,
        title: 'No Alerts Set',
        message: 'Create a price or signal alert to get notified when market conditions match.',
        action: ElevatedButton.icon(
          onPressed: _showCreateDialog,
          icon: const Icon(Icons.add_alert),
          label: const Text('Create Your First Alert'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchAlerts,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _alerts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final alert = _alerts[index];
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: alert.isActive
                    ? Colors.green.withValues(alpha: 0.15)
                    : Colors.grey.withValues(alpha: 0.15),
                child: Icon(
                  Icons.notifications,
                  color: alert.isActive ? Colors.green : Colors.grey,
                ),
              ),
              title: Text(alert.ticker,
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(alert.conditionLabel,
                  style: TextStyle(color: Colors.grey[600])),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Switch(
                    value: alert.isActive,
                    onChanged: (_) => _toggleAlert(alert),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () => _deleteAlert(alert.id),
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
