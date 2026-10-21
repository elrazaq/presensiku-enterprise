import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:device_info_plus/device_info_plus.dart';
import '../core/constants.dart';
import '../models/employee.dart';
import '../models/attendance.dart';
import '../models/shift.dart';
import '../models/dispensation.dart';
import 'storage_service.dart';

class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final String? errorCode;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.errorCode,
  });
}

class ApiService {
  static Future<String> getBaseUrl() async {
    final customUrl = await StorageService.getApiUrl();
    if (customUrl != null && customUrl.isNotEmpty) {
      return customUrl;
    }
    return AppConstants.defaultApiUrl;
  }

  /// Mendapatkan Device ID fisik perangkat yang unik & konsisten (Anti-Titip Absen)
  static Future<String> getHardwareDeviceId() async {
    final cached = await StorageService.getDeviceId();
    if (cached != null && cached.isNotEmpty) {
      return cached;
    }

    try {
      final deviceInfo = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        final id = 'ANDROID-${androidInfo.id}-${androidInfo.model.replaceAll(' ', '_')}';
        await StorageService.saveDeviceId(id);
        return id;
      }
    } catch (_) {}

    final fallback = 'DEVICE-${DateTime.now().millisecondsSinceEpoch}';
    await StorageService.saveDeviceId(fallback);
    return fallback;
  }

  /// 1. Login Mobile Pegawai dengan Device ID Binding
  static Future<ApiResponse<Employee>> loginMobile({
    required String nip,
    required String password,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final deviceId = await getHardwareDeviceId();

      final res = await http.post(
        Uri.parse('$baseUrl/auth/login/mobile'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'nip': nip.trim(),
          'password': password,
          'device_id': deviceId,
        }),
      );

      final Map<String, dynamic> body = jsonDecode(res.body);

      if (res.statusCode == 200 && body['status'] == 'success') {
        final token = body['data']['token'];
        final user = Employee.fromJson(body['data']['user']);

        await StorageService.saveToken(token);
        await StorageService.saveUser(user);

        return ApiResponse(
          success: true,
          message: 'Login berhasil.',
          data: user,
        );
      } else {
        return ApiResponse(
          success: false,
          message: body['message'] ?? 'Gagal login ke sistem.',
          errorCode: body['code'],
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Koneksi ke server gagal: $e',
      );
    }
  }

  /// 2. Absensi Masuk (Check-In) via Dynamic QR TOTP atau Foto Selfie
  static Future<ApiResponse<AttendanceRecord>> checkIn({
    required String method, // 'QR_TOTP' atau 'SELFIE'
    String? qrPayload,
    String? selfieBase64,
    required double latitude,
    required double longitude,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();
      final deviceId = await getHardwareDeviceId();

      if (token == null) {
        return ApiResponse(success: false, message: 'Sesi login telah habis.');
      }

      final payload = {
        'method': method,
        'latitude': latitude,
        'longitude': longitude,
        'device_id': deviceId,
        'is_mocked': false,
      };

      if (qrPayload != null) {
        payload['qr_payload'] = qrPayload;
        payload['qr_token'] = qrPayload;
      }
      if (selfieBase64 != null) {
        payload['selfie_base64'] = selfieBase64;
        payload['image_base64'] = selfieBase64;
      }

      final res = await http.post(
        Uri.parse('$baseUrl/attendance/check-in'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'X-Device-ID': deviceId,
        },
        body: jsonEncode(payload),
      );

      Map<String, dynamic> body;
      try {
        body = jsonDecode(res.body);
      } catch (_) {
        return ApiResponse(
          success: false,
          message: 'Server respon (${res.statusCode}): ${res.body.trim()}',
        );
      }

      if (res.statusCode == 200 && body['status'] == 'success') {
        final record = AttendanceRecord.fromJson(body['data']);
        return ApiResponse(
          success: true,
          message: body['message'] ?? 'Presensi masuk berhasil dicatat.',
          data: record,
        );
      } else {
        final errText = (body['message'] != null && body['message'].toString().trim().isNotEmpty)
            ? body['message'].toString()
            : (body['error'] != null && body['error'].toString().trim().isNotEmpty
                ? body['error'].toString()
                : 'Presensi masuk ditolak (${res.statusCode}).');
        return ApiResponse(
          success: false,
          message: errText,
          errorCode: body['code'],
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Gagal menghubungi server absensi: $e',
      );
    }
  }

  /// 3. Absensi Pulang (Check-Out)
  static Future<ApiResponse<AttendanceRecord>> checkOut({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();
      final deviceId = await getHardwareDeviceId();

      if (token == null) {
        return ApiResponse(success: false, message: 'Sesi login telah habis.');
      }

      final res = await http.post(
        Uri.parse('$baseUrl/attendance/check-out'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'X-Device-ID': deviceId,
        },
        body: jsonEncode({
          'latitude': latitude,
          'longitude': longitude,
          'device_id': deviceId,
        }),
      );

      Map<String, dynamic> body;
      try {
        body = jsonDecode(res.body);
      } catch (_) {
        return ApiResponse(
          success: false,
          message: 'Server respon (${res.statusCode}): ${res.body.trim()}',
        );
      }

      if (res.statusCode == 200 && body['status'] == 'success') {
        final record = AttendanceRecord.fromJson(body['data']);
        return ApiResponse(
          success: true,
          message: body['message'] ?? 'Presensi pulang berhasil dicatat.',
          data: record,
        );
      } else {
        final errText = (body['message'] != null && body['message'].toString().trim().isNotEmpty)
            ? body['message'].toString()
            : (body['error'] != null && body['error'].toString().trim().isNotEmpty
                ? body['error'].toString()
                : 'Presensi pulang gagal (${res.statusCode}).');
        return ApiResponse(
          success: false,
          message: errText,
          errorCode: body['code'],
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Gagal menghubungi server: $e',
      );
    }
  }

  /// 4. Mengambil Riwayat Presensi Pegawai
  static Future<List<AttendanceRecord>> getMyAttendanceHistory() async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();

      if (token == null) return [];

      var res = await http.get(
        Uri.parse('$baseUrl/attendance/my-history'),
        headers: {'Authorization': 'Bearer $token'},
      );

      // Fallback jika route alternate digunakan
      if (res.statusCode == 404) {
        res = await http.get(
          Uri.parse('$baseUrl/attendance/history/my'),
          headers: {'Authorization': 'Bearer $token'},
        );
      }

      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        if (body['data'] is List) {
          return (body['data'] as List)
              .map((item) => AttendanceRecord.fromJson(item))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  /// Ambil Riwayat Pengajuan Dispensasi Pegawai
  static Future<List<DispensationRequest>> getMyDispensations() async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();
      if (token == null) return [];

      final res = await http.get(
        Uri.parse('$baseUrl/dispensations/my'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        if (body['data'] is List) {
          return (body['data'] as List)
              .map((item) => DispensationRequest.fromJson(item))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  /// Sinkronisasi Data Profil & Penempatan Kerja Pegawai Terbaru dari Server
  static Future<Employee?> getMe() async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();
      if (token == null) return null;

      final res = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        if (body['data'] != null && body['data'] is Map<String, dynamic>) {
          final emp = Employee.fromJson(body['data']);
          await StorageService.saveUser(emp);
          return emp;
        }
      }
    } catch (_) {}
    return null;
  }

  /// 5. Mengambil Data Shift Pegawai
  static Future<List<Shift>> getShifts() async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();

      final res = await http.get(
        Uri.parse('$baseUrl/shifts'),
        headers: token != null ? {'Authorization': 'Bearer $token'} : {},
      );

      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        if (body['data'] is List) {
          return (body['data'] as List).map((i) => Shift.fromJson(i)).toList();
        }
      }
    } catch (_) {}
    return [
      Shift(
        id: 'default-reguler',
        name: 'Shift Reguler Pagi',
        startTime: '08:00',
        endTime: '17:00',
        lateToleranceMinutes: 15,
      )
    ];
  }

  /// 6. Pengajuan Koreksi Absen / Dispensasi ("Surat Sakti", Maksimal 3x)
  static Future<ApiResponse<DispensationRequest>> submitDispensation({
    required String requestDate,
    required String category,
    required String reason,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();

      if (token == null) {
        return ApiResponse(success: false, message: 'Sesi login telah habis.');
      }

      final res = await http.post(
        Uri.parse('$baseUrl/dispensations'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'request_date': requestDate,
          'requested_check_in': '08:00:00',
          'category': category,
          'reason': reason,
        }),
      );

      Map<String, dynamic> body;
      try {
        body = jsonDecode(res.body);
      } catch (_) {
        return ApiResponse(
          success: false,
          message: 'Server respon (${res.statusCode}): ${res.body.trim()}',
        );
      }

      if (res.statusCode == 200 && body['status'] == 'success') {
        final item = DispensationRequest.fromJson(body['data']);
        return ApiResponse(
          success: true,
          message: body['message'] ?? 'Pengajuan dispensasi berhasil diajukan ke HRD.',
          data: item,
        );
      } else {
        final errText = (body['message'] != null && body['message'].toString().trim().isNotEmpty)
            ? body['message'].toString()
            : (body['error'] != null && body['error'].toString().trim().isNotEmpty
                ? body['error'].toString()
                : 'Pengajuan dispensasi gagal (${res.statusCode}).');
        return ApiResponse(
          success: false,
          message: errText,
          errorCode: body['code'],
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Gagal mengirim pengajuan: $e',
      );
    }
  }

  /// 7. Pelaporan Forensik Pelanggaran Fake GPS ke Server Keamanan
  static Future<void> reportSecurityViolation({
    required String violationType,
    required String detail,
    required double latitude,
    required double longitude,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final token = await StorageService.getToken();
      final deviceId = await getHardwareDeviceId();
      final user = await StorageService.getUser();

      await http.post(
        Uri.parse('$baseUrl/violations'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'employee_id': user?.id,
          'violation_type': violationType,
          'detail': detail,
          'latitude': latitude,
          'longitude': longitude,
          'device_id': deviceId,
        }),
      );
    } catch (_) {}
  }

  /// 8. Mengambil Pengaturan Sistem (Kebijakan Metode Presensi: BOTH, QR_ONLY, SELFIE_ONLY)
  static Future<Map<String, String>> getSystemSettings() async {
    try {
      final baseUrl = await getBaseUrl();
      final res = await http.get(Uri.parse('$baseUrl/settings'));
      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        if (body['data'] is Map) {
          final Map<String, dynamic> rawMap = body['data'];
          final Map<String, String> result = {};
          rawMap.forEach((k, v) => result[k] = v.toString());
          return result;
        }
      }
    } catch (_) {}
    return {
      'attendance_method': 'BOTH',
      'app_name': 'PresensiKu Enterprise',
    };
  }
}
