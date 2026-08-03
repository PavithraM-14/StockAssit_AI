import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

// Import core
import 'core/theme/app_theme.dart';
import 'core/network/api_client.dart';

// Import features
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/signals/presentation/screens/signal_feed_screen.dart';
import 'features/watchlist/presentation/screens/watchlist_screen.dart';
import 'features/alerts/presentation/screens/alerts_screen.dart';
import 'features/ai_assistant/presentation/screens/ai_chat_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: 'AIzaSyDzabB8rDLKCqGsqEG_aRMnGC9Wn9dLTcc',
      appId: '1:780882566983:android:5c8e69bbf39a8f62e86c57',
      messagingSenderId: '780882566983',
      projectId: 'stockanalytics-40b2a',
    ),
  );
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Add your providers here
        Provider<ApiClient>(
          create: (_) => ApiClient(),
        ),
      ],
      child: MaterialApp(
        title: 'StockSense',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        debugShowCheckedModeBanner: false,
        home: const MainNavigationScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/signals': (context) => const SignalFeedScreen(),
          '/watchlist': (context) => const WatchlistScreen(),
          '/alerts': (context) => const AlertsScreen(),
          '/ai-chat': (context) => const AiChatScreen(),
        },
      ),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const SignalFeedScreen(),
    const WatchlistScreen(),
    const AlertsScreen(),
    const AiChatScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.trending_up),
            label: 'Signals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bookmark),
            label: 'Watchlist',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Alerts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat),
            label: 'AI Chat',
          ),
        ],
      ),
    );
  }
}
