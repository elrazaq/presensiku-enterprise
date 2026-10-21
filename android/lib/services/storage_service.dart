import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/employee.dart';

class StorageService {
  static const String _keyToken = 'presensiku_token';
  static const String _keyUser = 'presensiku_user';
  static const String _keyDeviceId = 'presensiku_device_id';
  static const String _keyApiUrl = 'presensiku_api_url';

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  static Future<void> saveUser(Employee employee) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(employee.toJson()));
  }

  static Future<Employee?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(_keyUser);
    if (userStr != null) {
      try {
        final Map<String, dynamic> data = jsonDecode(userStr);
        return Employee.fromJson(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  static Future<void> saveDeviceId(String deviceId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyDeviceId, deviceId);
  }

  static Future<String?> getDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyDeviceId);
  }

  static Future<void> saveApiUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyApiUrl, url);
  }

  static Future<String?> getApiUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyApiUrl);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    final savedDeviceId = prefs.getString(_keyDeviceId);
    final savedApiUrl = prefs.getString(_keyApiUrl);
    await prefs.clear();
    // Pertahankan device ID & URL server
    if (savedDeviceId != null) await prefs.setString(_keyDeviceId, savedDeviceId);
    if (savedApiUrl != null) await prefs.setString(_keyApiUrl, savedApiUrl);
  }
}
