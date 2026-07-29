import 'package:firebase_auth/firebase_auth.dart';

/// Authentication Repository wrapping Firebase Auth
class AuthRepository {
  final FirebaseAuth _firebaseAuth;

  AuthRepository({FirebaseAuth? firebaseAuth})
      : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  /// Stream of Firebase Auth state changes
  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  /// Returns current Firebase user
  User? get currentUser => _firebaseAuth.currentUser;

  /// Sign in with email and password
  Future<UserCredential> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return await _firebaseAuth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  /// Register new user with email and password
  Future<UserCredential> signUpWithEmail({
    required String email,
    required String password,
  }) async {
    return await _firebaseAuth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  /// Sign out current user
  Future<void> signOut() async {
    await _firebaseAuth.signOut();
  }

  /// Maps Firebase Auth Error Codes to User-Friendly Error Messages
  static String mapFirebaseAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'No user account found with this email address.';
      case 'wrong-password':
        return 'Incorrect password. Please try again.';
      case 'invalid-email':
        return 'The email address format is invalid.';
      case 'user-disabled':
        return 'This user account has been disabled.';
      case 'email-already-in-use':
        return 'An account already exists with this email address.';
      case 'operation-not-allowed':
        return 'Email/password sign-in is not enabled.';
      case 'weak-password':
        return 'The password is too weak. Please use at least 6 characters.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again in a few moments.';
      case 'network-request-failed':
        return 'Network connection error. Please check your internet connection.';
      case 'invalid-credential':
        return 'Invalid email or password. Please verify your credentials.';
      default:
        return e.message ?? 'Authentication failed. Please try again.';
    }
  }
}
