class DispensationRequest {
  final String id;
  final String employeeId;
  final String requestDate; // YYYY-MM-DD
  final String category; // LUPA_ABSEN_MASUK, TUGAS_LUAR, KENDALA_JARINGAN
  final String reason;
  final String status; // PENDING, APPROVED, REJECTED
  final String? approvedBy;
  final DateTime createdAt;

  DispensationRequest({
    required this.id,
    required this.employeeId,
    required this.requestDate,
    required this.category,
    required this.reason,
    required this.status,
    this.approvedBy,
    required this.createdAt,
  });

  factory DispensationRequest.fromJson(Map<String, dynamic> json) {
    return DispensationRequest(
      id: json['id'] ?? '',
      employeeId: json['employee_id'] ?? '',
      requestDate: json['request_date'] ?? '',
      category: json['category'] ?? 'LUPA_ABSEN_MASUK',
      reason: json['reason'] ?? '',
      status: json['status'] ?? 'PENDING',
      approvedBy: json['approved_by'],
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'request_date': requestDate,
      'category': category,
      'reason': reason,
    };
  }
}
