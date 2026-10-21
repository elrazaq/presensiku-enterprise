class AttendanceRecord {
  final String id;
  final String employeeId;
  final String? employeeName;
  final DateTime checkInTime;
  final DateTime? checkOutTime;
  final String status; // PRESENT, LATE, ABSENT, SICK, LEAVE
  final String checkInMethod; // QR_TOTP, SELFIE
  final double checkInDistance; // Meter
  final double checkInLatitude;
  final double checkInLongitude;
  final bool isLate;
  final int lateMinutes;
  final String? selfieUrl;
  final String? officeName;

  AttendanceRecord({
    required this.id,
    required this.employeeId,
    this.employeeName,
    required this.checkInTime,
    this.checkOutTime,
    required this.status,
    required this.checkInMethod,
    required this.checkInDistance,
    required this.checkInLatitude,
    required this.checkInLongitude,
    required this.isLate,
    required this.lateMinutes,
    this.selfieUrl,
    this.officeName,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id'] ?? '',
      employeeId: json['employee_id'] ?? '',
      employeeName: json['employee_name'] ?? json['full_name'],
      checkInTime: DateTime.tryParse(json['check_in_time'] ?? '') ?? DateTime.now(),
      checkOutTime: json['check_out_time'] != null
          ? DateTime.tryParse(json['check_out_time'])
          : null,
      status: json['status'] ?? 'PRESENT',
      checkInMethod: json['check_in_method'] ?? 'QR_TOTP',
      checkInDistance: (json['check_in_distance'] ?? 0.0).toDouble(),
      checkInLatitude: (json['check_in_latitude'] ?? 0.0).toDouble(),
      checkInLongitude: (json['check_in_longitude'] ?? 0.0).toDouble(),
      isLate: json['is_late'] ?? false,
      lateMinutes: json['late_minutes'] ?? 0,
      selfieUrl: json['selfie_url'],
      officeName: json['office_name'] ?? json['department_name'],
    );
  }
}
