import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import '../models/attendance.dart';

class AttendanceResultModal extends StatelessWidget {
  final AttendanceRecord record;
  final String title;
  final bool isCheckOut;

  const AttendanceResultModal({
    super.key,
    required this.record,
    this.title = 'Presensi Berhasil Dicatat',
    this.isCheckOut = false,
  });

  static Future<void> show(
    BuildContext context, {
    required AttendanceRecord record,
    String title = 'Presensi Berhasil Dicatat',
    bool isCheckOut = false,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AttendanceResultModal(
        record: record,
        title: title,
        isCheckOut: isCheckOut,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('HH:mm:ss').format(
      isCheckOut ? (record.checkOutTime ?? DateTime.now()) : record.checkInTime,
    );
    final dateStr = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(record.checkInTime);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag indicator
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Success / Status Badge Icon (Matching Reference Screen 3)
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: record.isLate
                  ? AppColors.warning.withOpacity(0.15)
                  : AppColors.oceanTeal.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              record.isLate ? Icons.access_time_filled : Icons.check_circle_rounded,
              size: 44,
              color: record.isLate ? AppColors.warning : AppColors.oceanTeal,
            ),
          ),
          const SizedBox(height: 14),

          // Title & Verification
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.verified, size: 14, color: AppColors.oceanTeal),
              const SizedBox(width: 4),
              Text(
                'Perangkat & GPS Terverifikasi',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Prominent Time Display (Matching Screen 3)
          Text(
            '$timeStr WIB',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              fontFamily: 'monospace',
              color: AppColors.deepNavy,
              letterSpacing: 1,
            ),
          ),
          Text(
            dateStr,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 24),

          // Detail Items Table
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cream.withOpacity(0.5),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cream),
            ),
            child: Column(
              children: [
                _buildRow(
                  label: 'Metode Presensi',
                  value: record.checkInMethod == 'QR_TOTP'
                      ? 'Dynamic QR Kiosk'
                      : 'Foto Wajah (Selfie)',
                  valueColor: AppColors.deepNavy,
                ),
                const Divider(height: 20, color: Color(0xFFE2E8F0)),
                _buildRow(
                  label: 'Zona Kantor',
                  value: record.officeName ?? 'Ruang Server & IT',
                  valueColor: AppColors.deepNavy,
                ),
                const Divider(height: 20, color: Color(0xFFE2E8F0)),
                _buildRow(
                  label: 'Jarak Geofence (Haversine)',
                  value: '${record.checkInDistance.toStringAsFixed(1)} Meter',
                  valueColor: AppColors.oceanTeal,
                ),
                const Divider(height: 20, color: Color(0xFFE2E8F0)),
                _buildRow(
                  label: 'Status Kedisiplinan',
                  value: record.isLate
                      ? 'Terlambat (+${record.lateMinutes} mnt)'
                      : 'Tepat Waktu',
                  valueColor: record.isLate ? AppColors.wine : AppColors.success,
                  isBold: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Action Button (Matching Screen 3 "Ok, Close")
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.deepNavy,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Ok, Tutup',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildRow({
    required String label,
    required String value,
    required Color valueColor,
    bool isBold = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
