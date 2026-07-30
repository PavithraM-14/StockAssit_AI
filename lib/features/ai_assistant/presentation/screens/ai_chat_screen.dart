import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/ai_repository.dart';
import '../widgets/chat_bubble.dart';

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
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;
  bool _hasShownDisclaimer = false;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? AiRepository();
    _messageCtrl = TextEditingController();
    _tickerCtrl = TextEditingController(text: widget.initialTicker ?? '');

    // Welcome message
    _messages.add(ChatMessage(
      role: MessageRole.ai,
      text: '👋 Hi! I\'m your AI stock analyst powered by Gemini.\n\n'
          'Enter a ticker symbol above and ask me anything — technical analysis, fundamentals, '
          'earnings reports, P/E ratios, sector trends, or what a specific signal means.\n\n'
          'Let\'s explore the market together! 📊',
    ));

    // Show disclaimer once at the top
    if (!_hasShownDisclaimer) {
      _messages.insert(0, ChatMessage(
        role: MessageRole.system,
        text: '⚠️ ${AppConstants.disclaimer}',
      ));
      _hasShownDisclaimer = true;
    }
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
        const SnackBar(
          content: Text('Please enter a stock ticker first.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _messages.add(ChatMessage(role: MessageRole.user, text: question));
      _messageCtrl.clear();
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final answer = await _repository.askAboutStock(
        ticker: ticker,
        question: question,
      );
      
      if (mounted) {
        setState(() {
          _messages.add(ChatMessage(role: MessageRole.ai, text: answer));
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(ChatMessage(
            role: MessageRole.ai,
            text: '⚠️ Sorry, I encountered an error: ${e.toString().replaceAll('AiException:', '').trim()}\n\n'
                'Please check your connection and try again.',
            isError: true,
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
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(68),
          child: Container(
            color: theme.appBarTheme.backgroundColor,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _tickerCtrl,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                filled: true,
                fillColor: theme.cardColor,
                hintText: 'Stock ticker (e.g. AAPL, TSLA, GOOGL)',
                prefixIcon: const Icon(Icons.search),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Chat messages list
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.chat_bubble_outline,
                            size: 64,
                            color: Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No messages yet',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Enter a ticker above and start asking questions!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      return ChatBubble(message: _messages[index]);
                    },
                  ),
          ),

          // Typing indicator
          if (_isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TypingIndicator(message: 'Analyzing with AI...'),
            ),

          // Input area
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageCtrl,
                onSubmitted: (_) => _isLoading ? null : _send(),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  hintText: 'Ask about this stock...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(
                      color: Theme.of(context).colorScheme.primary,
                      width: 2,
                    ),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            IconButton.filled(
              onPressed: _isLoading ? null : _send,
              icon: const Icon(Icons.send_rounded, size: 22),
              tooltip: 'Send message',
              style: IconButton.styleFrom(
                padding: const EdgeInsets.all(12),
                minimumSize: const Size(48, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
