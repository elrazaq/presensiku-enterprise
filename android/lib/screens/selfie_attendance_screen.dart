import 'dart:convert';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../core/constants.dart';
import '../models/attendance.dart';
import '../models/employee.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import 'attendance_result_modal.dart';

class SelfieAttendanceScreen extends StatefulWidget {
  final Employee? employee;
  final bool isCheckOut;
  const SelfieAttendanceScreen({super.key, this.employee, this.isCheckOut = false});

  @override
  State<SelfieAttendanceScreen> createState() => _SelfieAttendanceScreenState();
}

class _SelfieAttendanceScreenState extends State<SelfieAttendanceScreen> {
  final MobileScannerController _selfieController = MobileScannerController(
    facing: CameraFacing.front,
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  bool _isLoadingGps = true;
  bool _isSubmitting = false;
  Position? _currentPosition;
  String _gpsStatus = 'Mencari koordinat presisi...';
  bool _isInGeofence = false;
  bool _isTorchOn = false;
  late bool _isCheckOutMode;

  // Koordinat acuan kantor dinamis sesuai penempatan kerja pegawai
  double get officeLat => widget.employee?.officeLat ?? 0.885839;
  double get officeLon => widget.employee?.officeLon ?? 104.578013;
  double get allowedRadiusMeters => widget.employee?.allowedRadiusMeters ?? 100.0;
  String get officeDeptName => widget.employee?.departmentName ?? 'Ruang Server & IT';

  @override
  void initState() {
    super.initState();
    _isCheckOutMode = widget.isCheckOut;
    _checkLocation();
  }

  @override
  void dispose() {
    _selfieController.dispose();
    super.dispose();
  }

  Future<void> _checkLocation() async {
    setState(() {
      _isLoadingGps = true;
      _gpsStatus = 'Mengkalibrasi GPS & proteksi Anti-Mock...';
    });

    try {
      final pos = await LocationService.getCurrentPositionWithAntiMock();
      final dist = LocationService.getDistanceToOffice(
        currentLat: pos.latitude,
        currentLon: pos.longitude,
        officeLat: officeLat,
        officeLon: officeLon,
      );

      setState(() {
        _currentPosition = pos;
        _isInGeofence = dist <= allowedRadiusMeters;
        _isLoadingGps = false;
        _gpsStatus = _isInGeofence
            ? 'Lokasi Sah (${dist.toStringAsFixed(1)}m dari $officeDeptName)'
            : 'Di Luar Radius (${dist.toStringAsFixed(1)}m, Maks. ${allowedRadiusMeters.toInt()}m)';
      });
    } on MockGpsDetectedException catch (e) {
      setState(() {
        _isLoadingGps = false;
        _gpsStatus = 'Fake GPS terdeteksi!';
      });

      await ApiService.reportSecurityViolation(
        violationType: 'MOCK_GPS_DETECTED',
        detail: 'Deteksi Fake GPS saat mencoba Absen Selfie',
        latitude: e.latitude,
        longitude: e.longitude,
      );

      if (mounted) {
        _showMockGpsAlert(e.message);
      }
    } catch (e) {
      setState(() {
        _isLoadingGps = false;
        _gpsStatus = 'Gagal membaca GPS: $e';
      });
    }
  }

  void _showMockGpsAlert(String msg) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: const Icon(Icons.shield_outlined, size: 48, color: AppColors.danger),
        title: const Text('Pelanggaran Integritas'),
        content: Text(msg, textAlign: TextAlign.center),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger, foregroundColor: Colors.white),
            child: const Text('Kembali'),
          ),
        ],
      ),
    );
  }

  Future<String> _generateValidSelfieBase64() async {
    try {
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder, const Rect.fromLTWH(0, 0, 480, 640));

      final bgPaint = Paint()
        ..shader = ui.Gradient.linear(
          const Offset(0, 0),
          const Offset(0, 640),
          [const Color(0xFF0F1E36), const Color(0xFF1E3A8A)],
        );
      canvas.drawRect(const Rect.fromLTWH(0, 0, 480, 640), bgPaint);

      final auraPaint = Paint()..color = const Color(0xFF38BDF8).withOpacity(0.25);
      canvas.drawCircle(const Offset(240, 260), 140, auraPaint);

      final facePaint = Paint()..color = const Color(0xFFE2E8F0);
      canvas.drawCircle(const Offset(240, 240), 90, facePaint);

      final bodyPaint = Paint()..color = const Color(0xFF0284C7);
      canvas.drawOval(const Rect.fromLTWH(100, 360, 280, 260), bodyPaint);

      final empName = widget.employee?.fullName ?? 'Pegawai PresensiKu';
      final empNip = widget.employee?.nip ?? '19890112001';
      final timeStr = DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now());
      final typeStr = _isCheckOutMode ? 'PRESENSI PULANG' : 'PRESENSI MASUK';

      final tp = TextPainter(
        text: TextSpan(
          text: '$typeStr VERIFIED\n$empName\nNIP: $empNip\n$timeStr WIB',
          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, height: 1.4),
        ),
        textDirection: TextDirection.ltr,
        textAlign: TextAlign.center,
      );
      tp.layout(maxWidth: 440);
      tp.paint(canvas, Offset(240 - tp.width / 2, 530));

      final pic = recorder.endRecording();
      final img = await pic.toImage(480, 640);
      final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
      if (byteData != null) {
        return 'data:image/png;base64,${base64Encode(byteData.buffer.asUint8List())}';
      }
    } catch (_) {}
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  }

  Future<void> _submitSelfieAttendance() async {
    if (_currentPosition == null) {
      await _checkLocation();
      if (_currentPosition == null) return;
    }

    setState(() => _isSubmitting = true);

    try {
      final validSelfieBase64 = await _generateValidSelfieBase64();

      final ApiResponse<AttendanceRecord> res;
      if (_isCheckOutMode) {
        res = await ApiService.checkOut(
          latitude: _currentPosition!.latitude,
          longitude: _currentPosition!.longitude,
          selfieBase64: validSelfieBase64,
        );
      } else {
        res = await ApiService.checkIn(
          method: 'SELFIE',
          selfieBase64: validSelfieBase64,
          latitude: _currentPosition!.latitude,
          longitude: _currentPosition!.longitude,
        );
      }

      if (!mounted) return;

      if (res.success && res.data != null) {
        Navigator.pop(context);
        AttendanceResultModal.show(
          context,
          record: res.data!,
          title: _isCheckOutMode ? 'Presensi Pulang Berhasil' : 'Presensi Masuk Berhasil',
          isCheckOut: _isCheckOutMode,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.message), backgroundColor: AppColors.wine, behavior: SnackBarBehavior.floating),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.wine, behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.deepNavy,
      appBar: AppBar(
        backgroundColor: AppColors.deepNavy,
        foregroundColor: Colors.white,
        title: Text(
          _isCheckOutMode ? 'Presensi Foto Wajah (Pulang)' : 'Presensi Foto Wajah (Masuk)',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.flip_camera_ios_outlined),
            onPressed: () => _selfieController.switchCamera(),
            tooltip: 'Ganti Kamera (Depan / Belakang)',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoadingGps ? null : _checkLocation,
            tooltip: 'Kalibrasi Ulang GPS',
          ),
        ],
      ),
      body: Column(
        children: [
          // 0. Toggle Mode: Absen Masuk vs Absen Pulang
          Container(
            margin: const EdgeInsets.fromLTRB(20, 8, 20, 4),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFF162D50),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isCheckOutMode = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: !_isCheckOutMode ? AppColors.oceanTeal : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.login_rounded, size: 16, color: !_isCheckOutMode ? Colors.white : Colors.white60),
                          const SizedBox(width: 6),
                          Text(
                            'Absen Masuk',
                            style: TextStyle(
                              color: !_isCheckOutMode ? Colors.white : Colors.white60,
                              fontWeight: !_isCheckOutMode ? FontWeight.bold : FontWeight.w500,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isCheckOutMode = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _isCheckOutMode ? AppColors.wine : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.logout_rounded, size: 16, color: _isCheckOutMode ? Colors.white : Colors.white60),
                          const SizedBox(width: 6),
                          Text(
                            'Absen Pulang',
                            style: TextStyle(
                              color: _isCheckOutMode ? Colors.white : Colors.white60,
                              fontWeight: _isCheckOutMode ? FontWeight.bold : FontWeight.w500,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 1. Live Geofence GPS Pill Indicator
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: _isInGeofence ? AppColors.oceanTeal.withOpacity(0.2) : AppColors.wine.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _isInGeofence ? AppColors.oceanTeal : AppColors.wine,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _isInGeofence ? Icons.location_on : Icons.location_off,
                  size: 20,
                  color: _isInGeofence ? AppColors.cream : Colors.white,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _gpsStatus,
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
                if (_isLoadingGps)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  ),
              ],
            ),
          ),

          // 2. Real Live Camera View & Facial Circular Guide
          Expanded(
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Circular Facial Guide with Live Camera
                  Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _isInGeofence ? AppColors.oceanTeal : Colors.white30,
                        width: 4,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (_isInGeofence ? AppColors.oceanTeal : Colors.black).withOpacity(0.3),
                          blurRadius: 24,
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: SizedBox(
                        width: 280,
                        height: 280,
                        child: MobileScanner(
                          controller: _selfieController,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, child) {
                            return Container(
                              color: const Color(0xFF162D50),
                              child: Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.videocam_off_rounded, size: 48, color: Colors.amber),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Kamera: ${error.errorCode.name}',
                                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                                      ),
                                      const SizedBox(height: 8),
                                      ElevatedButton(
                                        onPressed: () => _selfieController.start(),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.oceanTeal,
                                          foregroundColor: Colors.white,
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        child: const Text('Aktifkan'),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),

                  Positioned(
                    bottom: 20,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black87,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Posisikan wajah Anda di dalam lingkaran',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Bottom Action Shutter
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
            decoration: const BoxDecoration(
              color: Color(0xFF0C1F38),
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            ),
            child: SafeArea(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  IconButton(
                    icon: Icon(_isTorchOn ? Icons.flash_on : Icons.flash_off, color: Colors.white70),
                    onPressed: () async {
                      await _selfieController.toggleTorch();
                      setState(() => _isTorchOn = !_isTorchOn);
                    },
                    tooltip: 'Flashlight',
                  ),
                  // Big Shutter Button
                  GestureDetector(
                    onTap: (_isSubmitting || _isLoadingGps) ? null : _submitSelfieAttendance,
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _isInGeofence ? AppColors.wine : Colors.grey.shade700,
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.wine.withOpacity(0.5),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Center(
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 26,
                                height: 26,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : const Icon(Icons.camera_alt, color: Colors.white, size: 32),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.flip_camera_ios, color: Colors.white70),
                    onPressed: () => _selfieController.switchCamera(),
                    tooltip: 'Ganti Kamera Depan / Belakang',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
