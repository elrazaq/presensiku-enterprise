import 'package:geolocator/geolocator.dart';
import '../core/constants.dart';

class MockGpsDetectedException implements Exception {
  final String message;
  final double latitude;
  final double longitude;
  MockGpsDetectedException({
    required this.message,
    required this.latitude,
    required this.longitude,
  });

  @override
  String toString() => message;
}

class LocationService {
  /// Memeriksa dan meminta izin lokasi dari perangkat Android
  static Future<bool> handleLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Mengambil posisi GPS perangkat saat ini dengan validasi Anti-Mock GPS
  static Future<Position> getCurrentPositionWithAntiMock() async {
    final hasPermission = await handleLocationPermission();
    if (!hasPermission) {
      throw Exception('Izin akses lokasi GPS ditolak oleh pengguna.');
    }

    final Position position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 10),
      ),
    );

    // =========================================================================
    // VALIDASI INTEGRITAS ANTI-FAKE GPS TINGKAT KERNEL
    // =========================================================================
    if (position.isMocked) {
      throw MockGpsDetectedException(
        message: 'Aplikasi Fake GPS / Mock Location terdeteksi aktif pada ponsel Anda!',
        latitude: position.latitude,
        longitude: position.longitude,
      );
    }

    return position;
  }

  /// Menghitung jarak terhadap titik koordinat kantor terdaftar
  static double getDistanceToOffice({
    required double currentLat,
    required double currentLon,
    required double officeLat,
    required double officeLon,
  }) {
    return HaversineHelper.calculateDistanceInMeters(
      currentLat,
      currentLon,
      officeLat,
      officeLon,
    );
  }
}
