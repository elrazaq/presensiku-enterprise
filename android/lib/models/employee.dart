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
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] ?? '',
      nip: json['nip'] ?? '',
      fullName: json['full_name'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'EMPLOYEE',
      positionTitle: json['position_title'],
      departmentId: json['department_id'],
      departmentName: json['department_name'],
      shiftId: json['shift_id'],
      shiftName: json['shift_name'],
      deviceIdBinding: json['device_id_binding'],
      isActive: json['is_active'] ?? true,
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
    };
  }
}
