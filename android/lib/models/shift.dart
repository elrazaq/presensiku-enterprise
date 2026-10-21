class Shift {
  final String id;
  final String name;
  final String startTime; // "08:00"
  final String endTime; // "17:00"
  final int lateToleranceMinutes; // 15
  final bool isActive;

  Shift({
    required this.id,
    required this.name,
    required this.startTime,
    required this.endTime,
    this.lateToleranceMinutes = 15,
    this.isActive = true,
  });

  factory Shift.fromJson(Map<String, dynamic> json) {
    return Shift(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Shift Reguler',
      startTime: _formatTimeStr(json['start_time'] ?? '08:00'),
      endTime: _formatTimeStr(json['end_time'] ?? '17:00'),
      lateToleranceMinutes: json['late_tolerance_minutes'] ?? 15,
      isActive: json['is_active'] ?? true,
    );
  }

  static String _formatTimeStr(String raw) {
    if (raw.length >= 5) {
      return raw.substring(0, 5);
    }
    return raw;
  }

  /// Menghitung apakah sekarang sudah melewati batas toleransi keterlambatan
  bool isLate(DateTime now) {
    final startParts = startTime.split(':');
    final shiftStart = DateTime(
      now.year,
      now.month,
      now.day,
      int.parse(startParts[0]),
      int.parse(startParts[1]),
    );
    final toleranceTime = shiftStart.add(Duration(minutes: lateToleranceMinutes));
    return now.isAfter(toleranceTime);
  }

  /// Menghitung akumulasi menit keterlambatan jika telat
  int calculateLateMinutes(DateTime now) {
    final startParts = startTime.split(':');
    final shiftStart = DateTime(
      now.year,
      now.month,
      now.day,
      int.parse(startParts[0]),
      int.parse(startParts[1]),
    );
    final toleranceTime = shiftStart.add(Duration(minutes: lateToleranceMinutes));
    if (now.isAfter(toleranceTime)) {
      return now.difference(shiftStart).inMinutes;
    }
    return 0;
  }

  /// Menghitung cut-off batas setengah hari (misal jam 12:00 untuk shift pagi)
  /// Setelah batas ini, absen masuk terkunci & status Tidak Hadir (Alpa)
  bool isPastHalfDayCutoff(DateTime now) {
    final startParts = startTime.split(':');
    final endParts = endTime.split(':');
    final shiftStart = DateTime(
      now.year,
      now.month,
      now.day,
      int.parse(startParts[0]),
      int.parse(startParts[1]),
    );
    final shiftEnd = DateTime(
      now.year,
      now.month,
      now.day,
      int.parse(endParts[0]),
      int.parse(endParts[1]),
    );

    final totalDuration = shiftEnd.difference(shiftStart);
    final halfDuration = Duration(minutes: (totalDuration.inMinutes / 2).round());
    final cutoffTime = shiftStart.add(halfDuration);

    return now.isAfter(cutoffTime);
  }

  String get halfDayCutoffStr {
    final startParts = startTime.split(':');
    final endParts = endTime.split(':');
    final now = DateTime.now();
    final shiftStart = DateTime(
      now.year,
      now.month,
      now.day,
      int.parse(startParts[0]),
      int.parse(startParts[1]),
    );
    final shiftEnd = DateTime(
      now.year,
      now.month,
      now.day,
      int.parse(endParts[0]),
      int.parse(endParts[1]),
    );

    final totalDuration = shiftEnd.difference(shiftStart);
    final halfDuration = Duration(minutes: (totalDuration.inMinutes / 2).round());
    final cutoffTime = shiftStart.add(halfDuration);

    final h = cutoffTime.hour.toString().padLeft(2, '0');
    final m = cutoffTime.minute.toString().padLeft(2, '0');
    return '$h:$m WIB';
  }
}
