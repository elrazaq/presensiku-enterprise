import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/employee.dart';

class StorageService {
  static const String _keyToken = 'presensiku_token';
  static const String _keyUser = 'presensiku_user';
  static const String _keyDeviceId = 'presensiku_device_id';
  static const String _keyApiUrl = 'presensiku_api_url';

  // In-memory cache fallback jika SharedPreferences mengalami PlatformException
  static final Map<String, String> _memoryCache = {};

  static Future<void> saveToken(String token) async {
    _memoryCache[_keyToken] = token;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyToken, token);
    } catch (e) {
      debugPrint('SharedPreferences saveToken error (fallback used): $e');
    }
  }

  static Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final val = prefs.getString(_keyToken);
      if (val != null) return val;
    } catch (e) {
      debugPrint('SharedPreferences getToken error (fallback used): $e');
    }
    return _memoryCache[_keyToken];
  }

  static Future<void> saveUser(Employee employee) async {
    final encoded = jsonEncode(employee.toJson());
    _memoryCache[_keyUser] = encoded;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyUser, encoded);
    } catch (e) {
      debugPrint('SharedPreferences saveUser error (fallback used): $e');
    }
  }

  static Future<Employee?> getUser() async {
    String? userStr;
    try {
      final prefs = await SharedPreferences.getInstance();
      userStr = prefs.getString(_keyUser);
    } catch (e) {
      debugPrint('SharedPreferences getUser error (fallback used): $e');
    }

    userStr ??= _memoryCache[_keyUser];

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
    _memoryCache[_keyDeviceId] = deviceId;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyDeviceId, deviceId);
    } catch (e) {
      debugPrint('SharedPreferences saveDeviceId error: $e');
    }
  }

  static Future<String?> getDeviceId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final val = prefs.getString(_keyDeviceId);
      if (val != null) return val;
    } catch (e) {
      debugPrint('SharedPreferences getDeviceId error: $e');
    }
    return _memoryCache[_keyDeviceId];
  }

  static Future<void> saveApiUrl(String url) async {
    _memoryCache[_keyApiUrl] = url;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyApiUrl, url);
    } catch (e) {
      debugPrint('SharedPreferences saveApiUrl error: $e');
    }
  }

  static Future<String?> getApiUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final val = prefs.getString(_keyApiUrl);
      if (val != null) return val;
    } catch (e) {
      debugPrint('SharedPreferences getApiUrl error: $e');
    }
    return _memoryCache[_keyApiUrl];
  }

  static Future<void> clearAll() async {
    final savedDeviceId = _memoryCache[_keyDeviceId];
    final savedApiUrl = _memoryCache[_keyApiUrl];
    _memoryCache.clear();
    if (savedDeviceId != null) _memoryCache[_keyDeviceId] = savedDeviceId;
    if (savedApiUrl != null) _memoryCache[_keyApiUrl] = savedApiUrl;

    try {
      final prefs = await SharedPreferences.getInstance();
      final devId = prefs.getString(_keyDeviceId) ?? savedDeviceId;
      final apiUrl = prefs.getString(_keyApiUrl) ?? savedApiUrl;
      await prefs.clear();
      if (devId != null) await prefs.setString(_keyDeviceId, devId);
      if (apiUrl != null) await prefs.setString(_keyApiUrl, apiUrl);
    } catch (e) {
      debugPrint('SharedPreferences clearAll error: $e');
    }
  }
}
