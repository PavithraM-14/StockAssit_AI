import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 1. Auth State Stream Provider
/// Streams Firebase authentication state changes
final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

/// 2. Current User Provider
/// Exposes the current Firebase user object
final currentUserProvider = Provider<User?>((ref) {
  final authAsync = ref.watch(authStateProvider);
  return authAsync.when(
    data: (user) => user,
    loading: () => FirebaseAuth.instance.currentUser,
    error: (_, __) => null,
  );
});

/// Notifier for theme mode management
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system);

  /// Toggle between light and dark theme mode
  void toggleTheme() {
    if (state == ThemeMode.light) {
      state = ThemeMode.dark;
    } else {
      state = ThemeMode.light;
    }
  }

  /// Explicitly set theme mode
  void setThemeMode(ThemeMode mode) {
    state = mode;
  }
}

/// 3. Theme Mode Provider
/// Global state for Light / Dark mode toggle
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});
