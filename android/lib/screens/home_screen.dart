import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import '../models/employee.dart';
import '../models/shift.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import 'qr_scanner_screen.dart';
import 'selfie_attendance_screen.dart';
import 'dispensation_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'attendance_result_modal.dart';

class HomeScreen extends StatefulWidget {
  final Employee employee;
  const HomeScreen({super.key, required this.employee});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _isCheckedIn = false;
  String? _checkInTimeStr;
  bool _isCheckingOut = false;
  Shift? _currentShift;
  String _attendanceMethod = 'BOTH'; // BOTH, QR_ONLY, SELFIE_ONLY
  late Employee _currentEmployee;

  @override
  void initState() {
    super.initState();
    _currentEmployee = widget.employee;
    _loadShiftAndTodayStatus();
  }

  Future<void> _loadShiftAndTodayStatus() async {
    // 0. Sinkronisasi Data Profil & Departemen Terbaru
    final updatedEmployee = await ApiService.getMe();
    if (updatedEmployee != null && mounted) {
      setState(() => _currentEmployee = updatedEmployee);
    }

    // 1. Ambil Kebijakan Metode Presensi dari Admin (QR / Selfie / Both)
    final settings = await ApiService.getSystemSettings();
    if (mounted && settings.containsKey('attendance_method')) {
      setState(() => _attendanceMethod = settings['attendance_method'] ?? 'BOTH');
    }

    // 2. Ambil Master Shift
    final shifts = await ApiService.getShifts();
    if (shifts.isNotEmpty && mounted) {
      setState(() => _currentShift = shifts.first);
    }

    // 3. Ambil Status Hari Ini
    final history = await ApiService.getMyAttendanceHistory();
    if (history.isNotEmpty && mounted) {
      final today = history.first;
      final now = DateTime.now();
      if (today.checkInTime.day == now.day &&
          today.checkInTime.month == now.month &&
          today.checkInTime.year == now.year) {
        setState(() {
          _isCheckedIn = true;
          _checkInTimeStr = DateFormat('HH:mm').format(today.checkInTime);
        });
      }
    }
  }

  void _handlePrimaryAction() {
    if (_attendanceMethod == 'SELFIE_ONLY') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => SelfieAttendanceScreen(employee: _currentEmployee)))
          .then((_) => _loadShiftAndTodayStatus());
    } else {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const QrScannerScreen()))
          .then((_) => _loadShiftAndTodayStatus());
    }
  }

  void _showRestrictedMethodDialog(String attemptedMethod, String requiredMethod) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: const Icon(Icons.policy_outlined, size: 44, color: AppColors.wine),
        title: const Text('Kebijakan Absensi Kantor', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
        content: Text(
          'Admin HRD menetapkan metode presensi saat ini WAJIB menggunakan $requiredMethod.\n\nMode $attemptedMethod sedang dinonaktifkan.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _handlePrimaryAction();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.deepNavy, foregroundColor: Colors.white),
            child: Text('Buka $requiredMethod'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleCheckOut() async {
    setState(() => _isCheckingOut = true);
    try {
      final pos = await LocationService.getCurrentPositionWithAntiMock();
      final res = await ApiService.checkOut(
        latitude: pos.latitude,
        longitude: pos.longitude,
      );

      if (!mounted) return;

      if (res.success && res.data != null) {
        AttendanceResultModal.show(
          context,
          record: res.data!,
          title: 'Presensi Pulang Berhasil',
          isCheckOut: true,
        );
        setState(() {
          _isCheckedIn = false;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.message), backgroundColor: AppColors.wine),
        );
      }
    } on MockGpsDetectedException catch (e) {
      await ApiService.reportSecurityViolation(
        violationType: 'MOCK_GPS_DETECTED',
        detail: 'Deteksi Fake GPS saat Presensi Pulang',
        latitude: e.latitude,
        longitude: e.longitude,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: AppColors.danger),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.wine),
        );
      }
    } finally {
      if (mounted) setState(() => _isCheckingOut = false);
    }
  }

  void _showGeofenceInfoDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: const Icon(Icons.share_location, size: 44, color: AppColors.oceanTeal),
        title: const Text('Radius & Geofence Kantor', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('• Lokasi Acuan: Ruang Server & IT Engineering', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            SizedBox(height: 6),
            Text('• Radius Toleransi: 30 Meter (Haversine Formula)', style: TextStyle(fontSize: 12)),
            SizedBox(height: 6),
            Text('• Proteksi: Anti-Mock GPS & Device ID Binding Aktif', style: TextStyle(fontSize: 12, color: AppColors.oceanTeal, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.deepNavy, foregroundColor: Colors.white),
            child: const Text('Tutup'),
          ),
        ],
      ),
    );
  }

  void _showShiftRuleDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: const Icon(Icons.access_time_filled, size: 44, color: AppColors.oceanTeal),
        title: const Text('Aturan Presensi Shift', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('• Jadwal: ${_currentShift?.startTime ?? "08:00"} - ${_currentShift?.endTime ?? "17:00"} WIB', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            Text('• Toleransi Keterlambatan: ${_currentShift?.lateToleranceMinutes ?? 15} Menit', style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 6),
            Text('• Batas Masuk (Cut-off): ${_currentShift?.halfDayCutoffStr ?? "12:00 WIB"}', style: const TextStyle(fontSize: 12, color: AppColors.wine, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'Catatan: Pegawai yang belum absen masuk hingga jam 12:00 otomatis berstatus Tidak Hadir (Alpa) dan tidak bisa langsung absen pulang, kecuali mengajukan dispensasi (jatah 3x).',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.deepNavy, foregroundColor: Colors.white),
            child: const Text('Paham'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 90),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. TOP HEADER (Matching Screen 2 in Reference)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Welcome Back',
                          style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _currentEmployee.fullName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.deepNavy,
                          ),
                        ),
                      ],
                    ),
                    // Notification Bell with Badge
                    Stack(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
                            ],
                          ),
                          child: const Icon(Icons.notifications_none_rounded, color: AppColors.deepNavy, size: 22),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.wine,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 2. VIRTUAL STATUS CARD (Matching Virtual Credit Card in Reference Screen 2)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Container(
                  height: 205,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: AppColors.cardGradient,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.deepNavy.withOpacity(0.35),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'STATUS HARI INI',
                                    style: TextStyle(color: AppColors.cream, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _attendanceMethod == 'QR_ONLY'
                                          ? AppColors.oceanTeal
                                          : (_attendanceMethod == 'SELFIE_ONLY' ? AppColors.wine : Colors.white24),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      _attendanceMethod == 'QR_ONLY'
                                          ? 'Mode: QR Kiosk'
                                          : (_attendanceMethod == 'SELFIE_ONLY' ? 'Mode: Selfie' : 'Mode: Bebas'),
                                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _isCheckedIn ? 'SUDAH HADIR ($_checkInTimeStr WIB)' : 'BELUM ABSEN MASUK',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.shield, color: AppColors.cream, size: 18),
                          ),
                        ],
                      ),
                      // Middle Row: NIP Format
                      Text(
                        'NIP • ${_currentEmployee.nip}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          letterSpacing: 2,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      // Bottom Row: Shift Info & Action
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _currentShift?.name ?? 'Shift Reguler (08:00 - 17:00)',
                                style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Batas Masuk: ${_currentShift?.halfDayCutoffStr ?? "12:00 WIB"}',
                                style: const TextStyle(color: AppColors.cream, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          if (_isCheckedIn)
                            ElevatedButton(
                              onPressed: _isCheckingOut ? null : _handleCheckOut,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.wine,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                              child: _isCheckingOut
                                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Absen Pulang', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            )
                          else
                            ElevatedButton.icon(
                              onPressed: _handlePrimaryAction,
                              icon: Icon(
                                _attendanceMethod == 'SELFIE_ONLY' ? Icons.camera_alt : Icons.qr_code_scanner,
                                size: 13,
                              ),
                              label: Text(
                                _attendanceMethod == 'SELFIE_ONLY' ? 'Absen Selfie' : 'Absen QR',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _attendanceMethod == 'SELFIE_ONLY' ? AppColors.wine : AppColors.oceanTeal,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 18),

              // 3. GRID OF 8 ACTION TILES (Matching Screen 2 Grid)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 14,
                  children: [
                    _buildActionTile(
                      icon: Icons.qr_code_scanner_rounded,
                      label: _attendanceMethod == 'SELFIE_ONLY' ? 'QR (Nonaktif)' : 'Absen QR',
                      iconColor: _attendanceMethod == 'SELFIE_ONLY' ? Colors.grey : AppColors.oceanTeal,
                      onTap: () {
                        if (_attendanceMethod == 'SELFIE_ONLY') {
                          _showRestrictedMethodDialog('Scan Barcode / QR Kiosk', 'Foto Wajah (Selfie)');
                        } else {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const QrScannerScreen())).then((_) => _loadShiftAndTodayStatus());
                        }
                      },
                    ),
                    _buildActionTile(
                      icon: Icons.camera_front_rounded,
                      label: _attendanceMethod == 'QR_ONLY' ? 'Selfie (Nonaktif)' : 'Selfie',
                      iconColor: _attendanceMethod == 'QR_ONLY' ? Colors.grey : AppColors.wine,
                      onTap: () {
                        if (_attendanceMethod == 'QR_ONLY') {
                          _showRestrictedMethodDialog('Foto Wajah (Selfie)', 'Scan Barcode / QR Kiosk');
                        } else {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => SelfieAttendanceScreen(employee: _currentEmployee))).then((_) => _loadShiftAndTodayStatus());
                        }
                      },
                    ),
                    _buildActionTile(
                      icon: Icons.assignment_outlined,
                      label: 'Dispensasi',
                      iconColor: AppColors.oceanTeal,
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const DispensationScreen()));
                      },
                    ),
                    _buildActionTile(
                      icon: Icons.history_rounded,
                      label: 'Riwayat',
                      iconColor: AppColors.deepNavy,
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
                      },
                    ),
                    _buildActionTile(
                      icon: Icons.location_on_outlined,
                      label: 'Geofence',
                      iconColor: AppColors.oceanTeal,
                      onTap: _showGeofenceInfoDialog,
                    ),
                    _buildActionTile(
                      icon: Icons.schedule_rounded,
                      label: 'Jadwal',
                      iconColor: AppColors.wine,
                      onTap: _showShiftRuleDialog,
                    ),
                    _buildActionTile(
                      icon: Icons.phonelink_lock,
                      label: 'Perangkat',
                      iconColor: AppColors.deepNavy,
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(employee: _currentEmployee)));
                      },
                    ),
                    _buildActionTile(
                      icon: Icons.support_agent_rounded,
                      label: 'HRD',
                      iconColor: AppColors.oceanTeal,
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Kontak HRD: hrd@presensiku.com | Gedung Utama Lt. 2'), behavior: SnackBarBehavior.floating),
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 22),

              // 4. STATISTIK KEDISIPLINAN CARD (Matching Bottom Chart Card in Screen 2)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Kedisiplinan Bulan Ini',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.deepNavy),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.cream,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Target KPI 95%',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.deepNavy),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildMiniStat('Kehadiran', '100%', AppColors.success),
                          Container(width: 1, height: 28, color: Colors.grey.shade200),
                          _buildMiniStat('Terlambat', '0 mnt', AppColors.oceanTeal),
                          Container(width: 1, height: 28, color: Colors.grey.shade200),
                          _buildMiniStat('Sisa Kuota Izin', '3 / 3', AppColors.wine),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),

      // 5. CUSTOM NOTCHED BOTTOM NAVIGATION BAR (Matching Screen 2 Bottom Bar)
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Container(
        height: 62,
        width: 62,
        margin: const EdgeInsets.only(top: 24),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: _attendanceMethod == 'SELFIE_ONLY'
              ? const LinearGradient(
                  colors: [AppColors.wine, AppColors.deepNavy],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : const LinearGradient(
                  colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)], // Golden yellow scanner button matching reference
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
          boxShadow: [
            BoxShadow(
              color: (_attendanceMethod == 'SELFIE_ONLY' ? AppColors.wine : const Color(0xFFF59E0B)).withOpacity(0.4),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: IconButton(
          icon: Icon(
            _attendanceMethod == 'SELFIE_ONLY' ? Icons.camera_alt_rounded : Icons.qr_code_scanner_rounded,
            color: Colors.white,
            size: 28,
          ),
          tooltip: _attendanceMethod == 'SELFIE_ONLY' ? 'Ambil Foto Selfie' : 'Scan Dynamic QR',
          onPressed: _handlePrimaryAction,
        ),
      ),
      bottomNavigationBar: Container(
        height: 70,
        decoration: const BoxDecoration(
          color: AppColors.deepNavy,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(
              icon: Icon(Icons.home_rounded, color: _currentIndex == 0 ? Colors.white : Colors.white54),
              onPressed: () => setState(() => _currentIndex = 0),
            ),
            IconButton(
              icon: Icon(Icons.history_rounded, color: _currentIndex == 1 ? Colors.white : Colors.white54),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
              },
            ),
            const SizedBox(width: 48), // Spacer for center FAB
            IconButton(
              icon: Icon(Icons.assignment_outlined, color: _currentIndex == 2 ? Colors.white : Colors.white54),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const DispensationScreen()));
              },
            ),
            IconButton(
              icon: Icon(Icons.person_outline_rounded, color: _currentIndex == 3 ? Colors.white : Colors.white54),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(employee: _currentEmployee)));
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String label,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppColors.deepNavy,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: valueColor, fontFamily: 'monospace')),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
