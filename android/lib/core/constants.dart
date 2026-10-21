import 'dart:math';
import 'package:flutter/material.dart';

/// Skema Warna PresensiKu Enterprise sesuai referensi:
/// - Primary Wine: #970747 (rgb: 151, 7, 71)
/// - Cream Ivory: #FEF4E8 (rgb: 254, 244, 232)
/// - Ocean Teal: #1989AC (rgb: 25, 137, 172)
/// - Deep Navy: #283E56 (rgb: 40, 62, 86)
class AppColors {
  static const Color wine = Color(0xFF970747);
  static const Color cream = Color(0xFFFEF4E8);
  static const Color oceanTeal = Color(0xFF1989AC);
  static const Color deepNavy = Color(0xFF283E56);

  // Gradient accents
  static const LinearGradient wineNavyGradient = LinearGradient(
    colors: [wine, deepNavy],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient tealNavyGradient = LinearGradient(
    colors: [oceanTeal, deepNavy],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF283E56), Color(0xFF1989AC)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Supporting semantics
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Colors.white;
  static const Color textDark = Color(0xFF1E293B);
  static const Color textMuted = Color(0xFF64748B);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
}

class AppConstants {
  // Default API Base URL (IP Wi-Fi Komputer Host untuk testing langsung di HP fisik)
  static const String defaultApiUrl = 'http://192.168.1.5:8080/api/v1';
  static const String fallbackEmulatorApiUrl = 'http://10.0.2.2:8080/api/v1';

  // Toleransi Keterlambatan Default (Menit)
  static const int defaultLateToleranceMinutes = 15;

  // Kuota Maksimal Pengajuan Dispensasi Absen Masuk ("Surat Sakti")
  static const int maxDispensationQuota = 3;
}

class HaversineHelper {
  /// Menghitung jarak antara 2 koordinat (latitude & longitude) dalam satuan Meter
  static double calculateDistanceInMeters(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadiusMeters = 6371000.0;
    final double dLat = _degToRad(lat2 - lat1);
    final double dLon = _degToRad(lon2 - lon1);

    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degToRad(lat1)) *
            cos(_degToRad(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);

    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  static double _degToRad(double degree) {
    return degree * (pi / 180.0);
  }
}
