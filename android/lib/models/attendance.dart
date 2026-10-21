class AttendanceRecord {
  final String id;
  final String employeeId;
  final String? employeeName;
  final DateTime checkInTime;
  final DateTime? checkOutTime;
  final String status; // PRESENT, LATE, ABSENT, SICK, LEAVE, HADIR
  final String checkInMethod; // QR_TOTP, SELFIE, SELFIE_FACE
  final double checkInDistance; // Meter
  final double checkInLatitude;
  final double checkInLongitude;
  final bool isLate;
  final int lateMinutes;
  final String? selfieUrl;
  final String? officeName;
  final String? notes;

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
    this.notes,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id']?.toString() ?? '',
      employeeId: json['employee_id']?.toString() ?? '',
      employeeName: json['employee_name']?.toString() ?? json['full_name']?.toString(),
      checkInTime: DateTime.tryParse(json['check_in_time']?.toString() ?? '') ?? DateTime.now(),
      checkOutTime: json['check_out_time'] != null
          ? DateTime.tryParse(json['check_out_time'].toString())
          : null,
      status: json['status']?.toString() ?? 'HADIR',
      checkInMethod: json['check_in_method']?.toString() ?? json['attendance_method']?.toString() ?? 'QR_TOTP',
      checkInDistance: (json['check_in_distance'] as num?)?.toDouble() ??
          (json['distance_meters'] as num?)?.toDouble() ??
          0.0,
      checkInLatitude: (json['check_in_latitude'] as num?)?.toDouble() ??
          (json['check_in_lat'] as num?)?.toDouble() ??
          0.0,
      checkInLongitude: (json['check_in_longitude'] as num?)?.toDouble() ??
          (json['check_in_lng'] as num?)?.toDouble() ??
          0.0,
      isLate: json['is_late'] == true || (json['late_minutes'] as num? ?? 0) > 0,
      lateMinutes: (json['late_minutes'] as num?)?.toInt() ?? 0,
      selfieUrl: json['selfie_url']?.toString(),
      officeName: json['office_name']?.toString() ?? json['department_name']?.toString(),
      notes: json['notes']?.toString(),
    );
  }
}
