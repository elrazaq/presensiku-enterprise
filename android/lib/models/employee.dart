class Employee {
  final String id;
  final String nip;
  final String fullName;
  final String email;
  final String role;
  final String? positionTitle;
  final String? departmentId;
  final String? departmentName;
  final String? shiftId;
  final String? shiftName;
  final String? deviceIdBinding;
  final bool isActive;
  final double officeLat;
  final double officeLon;
  final double allowedRadiusMeters;

  Employee({
    required this.id,
    required this.nip,
    required this.fullName,
    required this.email,
    required this.role,
    this.positionTitle,
    this.departmentId,
    this.departmentName,
    this.shiftId,
    this.shiftName,
    this.deviceIdBinding,
    this.isActive = true,
    this.officeLat = 0.885839,
    this.officeLon = 104.578013,
    this.allowedRadiusMeters = 100.0,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] ?? '',
      nip: json['nip'] ?? '',
      fullName: json['full_name'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'EMPLOYEE',
      positionTitle: json['position_title'] ?? json['position'],
      departmentId: json['department_id'],
      departmentName: json['department_name'] ?? json['department'],
      shiftId: json['shift_id'],
      shiftName: json['shift_name'] ?? json['shift'],
      deviceIdBinding: json['device_id_binding'] ?? json['bound_device'],
      isActive: json['is_active'] ?? true,
      officeLat: (json['office_lat'] as num?)?.toDouble() ?? 0.885839,
      officeLon: (json['office_lon'] as num?)?.toDouble() ?? 104.578013,
      allowedRadiusMeters: (json['allowed_radius_meters'] as num?)?.toDouble() ?? 100.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nip': nip,
      'full_name': fullName,
      'email': email,
      'role': role,
      'position_title': positionTitle,
      'department_id': departmentId,
      'department_name': departmentName,
      'shift_id': shiftId,
      'shift_name': shiftName,
      'device_id_binding': deviceIdBinding,
      'is_active': isActive,
      'office_lat': officeLat,
      'office_lon': officeLon,
      'allowed_radius_meters': allowedRadiusMeters,
    };
  }
}
