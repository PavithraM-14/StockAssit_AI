import 'package:flutter/material.dart';

/// Central App Theme & Color System for StockSense
class AppTheme {
  // Brand Primary & Accent Colors
  static const Color primaryColor = Color(0xFF0F172A);   // Deep Slate Blue
  static const Color accentColor = Color(0xFF2563EB);    // Vibrant Royal Blue

  // Signal Badge Colors (Named Constants for consistent reuse across signal_card & signal_badge)
  static const Color buyColor = Color(0xFF10B981);       // Emerald Green (BUY)
  static const Color buyBgColor = Color(0xFFD1FAE5);     // Light Green Tint
  static const Color buyDarkBgColor = Color(0xFF064E3B); // Dark Green Tint

  static const Color sellColor = Color(0xFFEF4444);      // Crimson Red (SELL)
  static const Color sellBgColor = Color(0xFFFEE2E2);    // Light Red Tint
  static const Color sellDarkBgColor = Color(0xFF7F1D1D); // Dark Red Tint

  static const Color holdColor = Color(0xFFF59E0B);      // Amber / Yellow (HOLD)
  static const Color holdBgColor = Color(0xFFFEF3C7);    // Light Amber Tint
  static const Color holdDarkBgColor = Color(0xFF78350F); // Dark Amber Tint

  static const Color watchColor = Color(0xFF6B7280);     // Slate Gray / Blue (WATCH)
  static const Color watchBgColor = Color(0xFFF3F4F6);   // Light Gray Tint
  static const Color watchDarkBgColor = Color(0xFF1F2937); // Dark Gray Tint

  // Helper method to retrieve signal color by type string
  static Color getSignalColor(String signalType) {
    switch (signalType.toUpperCase()) {
      case 'BUY':
        return buyColor;
      case 'SELL':
        return sellColor;
      case 'HOLD':
        return holdColor;
      case 'WATCH':
      default:
        return watchColor;
    }
  }

  // Helper method to retrieve signal background color by type string
  static Color getSignalBgColor(String signalType, {bool isDark = false}) {
    if (isDark) {
      switch (signalType.toUpperCase()) {
        case 'BUY':
          return buyDarkBgColor;
        case 'SELL':
          return sellDarkBgColor;
        case 'HOLD':
          return holdDarkBgColor;
        case 'WATCH':
        default:
          return watchDarkBgColor;
      }
    }
    switch (signalType.toUpperCase()) {
      case 'BUY':
        return buyBgColor;
      case 'SELL':
        return sellBgColor;
      case 'HOLD':
        return holdBgColor;
      case 'WATCH':
      default:
        return watchBgColor;
    }
  }

  // Typography TextTheme
  static const TextTheme _textTheme = TextTheme(
    displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: -0.5),
    displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: -0.5),
    displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
    headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
    titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
    titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
    bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.normal),
    bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.normal),
    bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
    labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
  );

  // Light Theme Variant
  static ThemeData get lightTheme {
    const backgroundColor = Color(0xFFF8FAFC);
    const surfaceColor = Colors.white;

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceColor,
        error: sellColor,
      ),
      textTheme: _textTheme.apply(
        bodyColor: const Color(0xFF0F172A),
        displayColor: const Color(0xFF0F172A),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: surfaceColor,
        foregroundColor: Color(0xFF0F172A),
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
      ),
      cardTheme: CardTheme(
        elevation: 1,
        color: surfaceColor,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF1F5F9),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  // Dark Theme Variant
  static ThemeData get darkTheme {
    const darkBackgroundColor = Color(0xFF090D16);
    const darkSurfaceColor = Color(0xFF1E293B);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: accentColor,
      scaffoldBackgroundColor: darkBackgroundColor,
      colorScheme: const ColorScheme.dark(
        primary: accentColor,
        secondary: accentColor,
        surface: darkSurfaceColor,
        error: sellColor,
      ),
      textTheme: _textTheme.apply(
        bodyColor: const Color(0xFFF8FAFC),
        displayColor: const Color(0xFFF8FAFC),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: darkSurfaceColor,
        foregroundColor: Color(0xFFF8FAFC),
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC)),
      ),
      cardTheme: CardTheme(
        elevation: 2,
        color: darkSurfaceColor,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF334155)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1E293B),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
