import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/employee.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final Employee employee;
  const ProfileScreen({super.key, required this.employee});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _hardwareDeviceId = 'Memuat identitas hardware...';

  @override
  void initState() {
    super.initState();
    _loadDevice();
  }

  Future<void> _loadDevice() async {
    final dev = await ApiService.getHardwareDeviceId();
    if (mounted) setState(() => _hardwareDeviceId = dev);
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Keluar dari Akun', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
        content: const Text('Apakah Anda yakin ingin keluar dari aplikasi PresensiKu?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.wine, foregroundColor: Colors.white),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await StorageService.clearAll();
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.deepNavy,
        foregroundColor: Colors.white,
        title: const Text('Profil & Keamanan Akun', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // 1. Avatar & Name Header
            Center(
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.wineNavyGradient,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.wine.withOpacity(0.3),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        widget.employee.fullName.isNotEmpty
                            ? widget.employee.fullName.substring(0, 1).toUpperCase()
                            : 'P',
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.employee.fullName,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.deepNavy),
                  ),
                  Text(
                    'NIP: ${widget.employee.nip}',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.oceanTeal.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      widget.employee.positionTitle ?? 'Pegawai Tetap',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.oceanTeal),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // 2. Hardware Device Binding Card (Anti-Titip Absen)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.phonelink_lock, size: 18, color: AppColors.oceanTeal),
                      SizedBox(width: 8),
                      Text(
                        'Device Binding (Anti-Titip Absen)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.deepNavy),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Akun Anda terikat pada 1 perangkat fisik ini. Presensi hanya sah bila dilakukan dari ponsel ini.',
                    style: TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      _hardwareDeviceId,
                      style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: AppColors.textDark),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. Information Details
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  _buildProfileTile(Icons.email_outlined, 'Email Resmi', widget.employee.email),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildProfileTile(Icons.access_time_filled, 'Jadwal Kerja', widget.employee.shiftName ?? 'Shift Reguler (08:00 - 17:00)'),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildProfileTile(Icons.apartment, 'Departemen', widget.employee.departmentName ?? 'Direktorat Operasional'),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // 4. Logout Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Keluar dari Akun', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.wine,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileTile(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.oceanTeal),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
            const SizedBox(height: 1),
            Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
          ],
        ),
      ],
    );
  }
}
