import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import '../models/dispensation.dart';
import '../services/api_service.dart';

class DispensationScreen extends StatefulWidget {
  const DispensationScreen({super.key});

  @override
  State<DispensationScreen> createState() => _DispensationScreenState();
}

class _DispensationScreenState extends State<DispensationScreen> {
  final _reasonController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  String _selectedCategory = 'LUPA_ABSEN_MASUK';
  bool _isSubmitting = false;
  int _usedQuota = 0;
  final int _maxQuota = AppConstants.maxDispensationQuota;

  final List<DispensationRequest> _myRequests = [];

  final List<Map<String, String>> _categories = [
    {'value': 'LUPA_ABSEN_MASUK', 'label': 'Lupa Absensi Masuk'},
    {'value': 'TUGAS_LUAR', 'label': 'Penugasan / Dinas Luar Kantor'},
    {'value': 'KENDALA_JARINGAN', 'label': 'Kendala Jaringan / Mati Lampu'},
    {'value': 'KEADAAN_DARURAT', 'label': 'Keadaan Darurat / Force Majeure'},
  ];

  @override
  void initState() {
    super.initState();
    _loadDispensations();
  }

  Future<void> _loadDispensations() async {
    final list = await ApiService.getMyDispensations();
    if (mounted) {
      setState(() {
        _myRequests.clear();
        _myRequests.addAll(list);
        _usedQuota = list.length;
      });
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  int get _remainingQuota => _maxQuota - _usedQuota;

  Future<void> _submitRequest() async {
    if (_remainingQuota <= 0) {
      _showWarning('Jatah kuota pengajuan dispensasi Anda telah habis (3/3 kali).');
      return;
    }

    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      _showWarning('Harap isi alasan permohonan dispensasi.');
      return;
    }

    setState(() => _isSubmitting = true);

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    final res = await ApiService.submitDispensation(
      requestDate: dateStr,
      category: _selectedCategory,
      reason: reason,
    );

    if (!mounted) return;

    setState(() => _isSubmitting = false);

    if (res.success && res.data != null) {
      setState(() {
        _usedQuota++;
        _myRequests.insert(0, res.data!);
        _reasonController.clear();
      });

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          icon: const Icon(Icons.check_circle_rounded, size: 48, color: AppColors.oceanTeal),
          title: const Text('Pengajuan Terkirim', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
          content: Text(
            'Permohonan dispensasi tanggal $dateStr berhasil diteruskan ke HRD untuk ditinjau.\nSisa jatah pengajuan Anda: $_remainingQuota kali.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.deepNavy, foregroundColor: Colors.white),
              child: const Text('Mengerti'),
            ),
          ],
        ),
      );
    } else {
      _showWarning(res.message);
    }
  }

  void _showWarning(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.wine, behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.deepNavy,
        foregroundColor: Colors.white,
        title: const Text(
          'Pengajuan Dispensasi Presensi',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Quota Info Card (Sisa Jatah Kuota 3x)
            Container(
              padding: const EdgeInsets.all(18),
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
                        'Jatah Dispensasi Masuk',
                        style: TextStyle(color: AppColors.cream, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _remainingQuota > 0 ? AppColors.wine : Colors.grey,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Sisa: $_remainingQuota / $_maxQuota',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Setiap pegawai memiliki hak maksimal 3x pengajuan koreksi jika lupa absen masuk atau terhalang cut-off setengah hari (jam 12:00).',
                    style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 2. Form Pengajuan Baru
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Formulir Permohonan Izin / Koreksi',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.deepNavy),
                  ),
                  const SizedBox(height: 16),

                  // Tanggal Kejadian
                  const Text('Tanggal Kejadian', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDark)),
                  const SizedBox(height: 6),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime.now().subtract(const Duration(days: 14)),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) setState(() => _selectedDate = picked);
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(_selectedDate),
                            style: const TextStyle(fontSize: 13, color: AppColors.textDark),
                          ),
                          const Icon(Icons.calendar_month, size: 18, color: AppColors.oceanTeal),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Kategori Alasan
                  const Text('Kategori Pengajuan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDark)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedCategory,
                        isExpanded: true,
                        items: _categories.map((c) {
                          return DropdownMenuItem(
                            value: c['value'],
                            child: Text(c['label']!, style: const TextStyle(fontSize: 13)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedCategory = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Keterangan / Alasan
                  const Text('Keterangan & Rincian Tugas', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDark)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _reasonController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Tuliskan alasan lengkap mengapa tidak dapat presensi tepat waktu...',
                      hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Tombol Kirim
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: (_isSubmitting || _remainingQuota <= 0) ? null : _submitRequest,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.deepNavy,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Kirim Pengajuan ke HRD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 3. Riwayat Pengajuan Dispensasi
            const Text(
              'Riwayat Permohonan Dispensasi',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.deepNavy),
            ),
            const SizedBox(height: 12),

            if (_myRequests.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.assignment_turned_in_outlined, size: 40, color: Colors.grey.shade300),
                      const SizedBox(height: 8),
                      Text(
                        'Belum ada permohonan dispensasi yang diajukan.',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _myRequests.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, idx) {
                  final req = _myRequests[idx];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              req.category.replaceAll('_', ' '),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.deepNavy),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Tanggal: ${req.requestDate}',
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: req.status == 'APPROVED'
                                ? AppColors.success.withOpacity(0.15)
                                : AppColors.warning.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            req.status,
                            style: TextStyle(
                              color: req.status == 'APPROVED' ? AppColors.success : AppColors.warning,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
