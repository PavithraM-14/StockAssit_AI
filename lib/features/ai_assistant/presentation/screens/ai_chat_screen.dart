import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/ai_repository.dart';

enum _MessageRole { user, ai }

class _ChatMessage {
  final _MessageRole role;
  final String text;
  final DateTime timestamp;

  _ChatMessage({required this.role, required this.text}) : timestamp = DateTime.now();
}

/// AI Chat Screen — Conversational Q&A about stocks powered by Gemini via backend
class AiChatScreen extends StatefulWidget {
  final String? initialTicker;
  final AiRepository? repository;

  const AiChatScreen({Key? key, this.initialTicker, this.repository}) : super(key: key);

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  late final AiRepository _repository;
  late final TextEditingController _messageCtrl;
  late final TextEditingController _tickerCtrl;
  final ScrollController _scrollCtrl = ScrollController();
  final List<_ChatMessage> _messages = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? AiRepository();
    _messageCtrl = TextEditingController();
    _tickerCtrl = TextEditingController(text: widget.initialTicker ?? '');

    // Welcome message
    _messages.add(_ChatMessage(
      role: _MessageRole.ai,
      text: '👋 Hi! I\'m your AI stock analyst powered by Gemini.\n\n'
          'Enter a ticker above and ask me anything — technical analysis, earnings, P/E ratios, sector trends, or what a signal means. '
          'Remember: ${AppConstants.disclaimer.substring(0, 120)}...',
    ));
  }

  @override
  void dispose() {
    _messageCtrl.dispose();
    _tickerCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final question = _messageCtrl.text.trim();
    final ticker = _tickerCtrl.text.trim().toUpperCase();

    if (question.isEmpty) return;
    if (ticker.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a stock ticker first.')),
      );
      return;
    }

    setState(() {
      _messages.add(_ChatMessage(role: _MessageRole.user, text: question));
      _messageCtrl.clear();
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final answer = await _repository.askAboutStock(ticker: ticker, question: question);
      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(role: _MessageRole.ai, text: answer));
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(
            role: _MessageRole.ai,
            text: '⚠️ Sorry, I encountered an error: $e\n\nPlease try again.',
          ));
          _isLoading = false;
        });
        _scrollToBottom();
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Stock Analyst'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: TextField(
              controller: _tickerCtrl,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                filled: true,
                fillColor: theme.cardColor,
                hintText: 'Ticker symbol, e.g. AAPL',
                prefixIcon: const Icon(Icons.search),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Chat messages list
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) => _buildBubble(_messages[index]),
            ),
          ),

          // Typing indicator
          if (_isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 10),
                  Text('Analyzing...', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                ],
              ),
            ),

          // Disclaimer strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            color: Colors.amber[50],
            child: Text(
              '⚠️ Not financial advice — for educational purposes only.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: Colors.amber[900]),
            ),
          ),

          // Input area
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildBubble(_ChatMessage message) {
    final isUser = message.role == _MessageRole.user;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isUser
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).cardColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Text(
          message.text,
          style: TextStyle(
            color: isUser ? Colors.white : null,
            height: 1.45,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, -2)),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageCtrl,
                onSubmitted: (_) => _isLoading ? null : _send(),
                decoration: InputDecoration(
                  hintText: 'Ask about this stock...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: _isLoading ? null : _send,
              icon: const Icon(Icons.send_rounded),
              tooltip: 'Send',
            ),
          ],
        ),
      ),
    );
  }
}
