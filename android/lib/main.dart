import 'package:flutter/material.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PresensiKuApp());
}

class PresensiKuApp extends StatelessWidget {
  const PresensiKuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PresensiKu Enterprise',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const PlaceholderHomeScreen(),
    );
  }
}

class PlaceholderHomeScreen extends StatelessWidget {
  const PlaceholderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text(
          'PresensiKu Enterprise',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 16,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            'Skeleton Flutter App Siap Dikembangkan.\nModul Login, GPS Geofencing (Anti-Mock GPS), & QR Scanner akan dibangun bertahap sesuai Rencana Implementasi.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF475569), fontSize: 14),
          ),
        ),
      ),
    );
  }
}
