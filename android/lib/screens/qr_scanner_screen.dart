import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../core/constants.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import 'attendance_result_modal.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
  );

  bool _isProcessing = false;
  bool _isTorchOn = false;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final rawValue = barcodes.first.rawValue;
    if (rawValue == null || !rawValue.startsWith('PKQR:')) {
      _showErrorSnackBar('Format QR Code tidak valid. Pastikan scan QR Kiosk resmi.');
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // 1. Ambil Lokasi GPS & Periksa Proteksi Anti-Mock GPS
      final position = await LocationService.getCurrentPositionWithAntiMock();

      // 2. Kirim Check-In ke Server
      final res = await ApiService.checkIn(
        method: 'QR_TOTP',
        qrPayload: rawValue,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      if (!mounted) return;

      if (res.success && res.data != null) {
        Navigator.pop(context);
        AttendanceResultModal.show(context, record: res.data!);
      } else {
        _showErrorDialog(
          title: 'Presensi Ditolak',
          message: res.message,
        );
      }
    } on MockGpsDetectedException catch (e) {
      // Pelanggaran Fake GPS terdeteksi!
      await ApiService.reportSecurityViolation(
        violationType: 'MOCK_GPS_DETECTED',
        detail: 'Deteksi Fake GPS saat scan QR Kiosk',
        latitude: e.latitude,
        longitude: e.longitude,
      );

      if (mounted) {
        _showMockGpsAlert(e.message);
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog(
          title: 'Kendala Presensi',
          message: e.toString(),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _showMockGpsAlert(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: const Icon(Icons.warning_amber_rounded, size: 48, color: AppColors.danger),
        title: const Text(
          'Peringatan Keamanan Sistem',
          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.deepNavy),
        ),
        content: Text(
          '$message\n\nSistem telah merekam insiden ini ke dalam Log Audit Integritas Perusahaan.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: AppColors.textDark),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Tutup dialog
              Navigator.pop(context); // Kembali ke beranda
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: const Text('Tutup'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog({required String title, required String message}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: const Icon(Icons.error_outline, size: 44, color: AppColors.wine),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
        content: Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13)),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.deepNavy, foregroundColor: Colors.white),
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.wine, behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text(
          'Scan Dynamic QR Kiosk',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.flip_camera_ios_outlined),
            onPressed: () async {
              await _scannerController.switchCamera();
            },
            tooltip: 'Ganti Kamera',
          ),
          IconButton(
            icon: Icon(_isTorchOn ? Icons.flash_on : Icons.flash_off),
            onPressed: () async {
              await _scannerController.toggleTorch();
              setState(() => _isTorchOn = !_isTorchOn);
            },
            tooltip: 'Flashlight',
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Live Camera Scanner View
          MobileScanner(
            controller: _scannerController,
            onDetect: _handleBarcode,
            errorBuilder: (context, error, child) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.videocam_off_rounded, color: Colors.amber, size: 52),
                      const SizedBox(height: 12),
                      const Text(
                        'Kamera Belum Aktif',
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Detail status: ${error.errorCode.name}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      const SizedBox(height: 18),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('Buka / Aktifkan Kamera'),
                        onPressed: () => _scannerController.start(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.oceanTeal,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // 2. Scanner Overlay Box & Guides
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.oceanTeal, width: 3),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.oceanTeal.withOpacity(0.2),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 10,
                    left: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.shield_outlined, size: 12, color: AppColors.cream),
                          SizedBox(width: 4),
                          Text(
                            'HMAC-SHA256 TOTP Validator',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Bottom Information Banner
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.deepNavy.withOpacity(0.92),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white12),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Arahkan kamera ke layar Monitor Kiosk',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'QR Code berganti setiap 30 detik untuk mencegah kecurangan foto layar.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                ],
              ),
            ),
          ),

          // 4. Loading Overlay Indicator
          if (_isProcessing)
            Container(
              color: Colors.black.withOpacity(0.75),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppColors.oceanTeal),
                    SizedBox(height: 16),
                    Text(
                      'Memvalidasi QR & Geofence GPS...',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
