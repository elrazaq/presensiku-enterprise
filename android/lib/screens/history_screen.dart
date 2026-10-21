import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import '../models/attendance.dart';
import '../services/api_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  bool _isLoading = true;
  List<AttendanceRecord> _records = [];
  int _totalLateMinutes = 0;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    final list = await ApiService.getMyAttendanceHistory();

    int lateMins = 0;
    for (var r in list) {
      if (r.isLate) lateMins += r.lateMinutes;
    }

    if (mounted) {
      setState(() {
        _records = list;
        _totalLateMinutes = lateMins;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.deepNavy,
        foregroundColor: Colors.white,
        title: const Text('Riwayat & Evaluasi Presensi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _fetchHistory,
            tooltip: 'Perbarui Data',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.oceanTeal))
          : RefreshIndicator(
              onRefresh: _fetchHistory,
              color: AppColors.oceanTeal,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. Akumulasi Keterlambatan & Evaluasi HRD Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: AppColors.cardGradient,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.deepNavy.withOpacity(0.18),
                            blurRadius: 14,
                            offset: const Offset(0, 6),
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
                                'Evaluasi Kedisiplinan HRD',
                                style: TextStyle(color: AppColors.cream, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _totalLateMinutes > 15 ? AppColors.wine : AppColors.success,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  _totalLateMinutes > 15 ? 'Perlu Evaluasi' : 'Kepatuhan Baik',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '$_totalLateMinutes Menit',
                                    style: const TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                  const Text(
                                    'Akumulasi Keterlambatan Bulan Ini',
                                    style: TextStyle(color: Colors.white70, fontSize: 11),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 2. Daftar Log Presensi
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Catatan Presensi Harian',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.deepNavy),
                        ),
                        Text(
                          'Total: ${_records.length} log',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    if (_records.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.history_toggle_off, size: 48, color: Colors.grey.shade300),
                              const SizedBox(height: 10),
                              Text(
                                'Belum ada catatan presensi tersimpan.',
                                style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _records.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, idx) {
                          final item = _records[idx];
                          final dateStr = DateFormat('EEEE, d MMM yyyy', 'id_ID').format(item.checkInTime);
                          final inStr = DateFormat('HH:mm').format(item.checkInTime);
                          final outStr = item.checkOutTime != null
                              ? DateFormat('HH:mm').format(item.checkOutTime!)
                              : '--:--';

                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.grey.shade200),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      dateStr,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.deepNavy),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: item.isLate
                                            ? AppColors.wine.withOpacity(0.12)
                                            : AppColors.success.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        item.isLate
                                            ? 'Terlambat (+${item.lateMinutes}m)'
                                            : 'Tepat Waktu',
                                        style: TextStyle(
                                          color: item.isLate ? AppColors.wine : AppColors.success,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 18, color: Color(0xFFF1F5F9)),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: [
                                    _buildTimeCol('Masuk', inStr, Icons.login, AppColors.oceanTeal),
                                    Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                                    _buildTimeCol('Pulang', outStr, Icons.logout, AppColors.wine),
                                    Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                                    _buildTimeCol(
                                      'Metode',
                                      item.checkInMethod == 'QR_TOTP' ? 'QR TOTP' : 'Selfie',
                                      Icons.qr_code_scanner,
                                      AppColors.deepNavy,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTimeCol(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color, fontFamily: 'monospace'),
        ),
      ],
    );
  }
}
