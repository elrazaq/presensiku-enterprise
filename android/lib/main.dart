import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/constants.dart';
import 'models/employee.dart';
import 'services/storage_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID', null);

  final token = await StorageService.getToken();
  final user = await StorageService.getUser();

  runApp(PresensiKuApp(initialUser: token != null ? user : null));
}

class PresensiKuApp extends StatelessWidget {
  final Employee? initialUser;
  const PresensiKuApp({super.key, this.initialUser});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PresensiKu Enterprise',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.deepNavy,
          primary: AppColors.deepNavy,
          secondary: AppColors.oceanTeal,
          surface: Colors.white,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: AppColors.background,
        useMaterial3: true,
        fontFamily: 'sans-serif',
      ),
      home: initialUser != null
          ? HomeScreen(employee: initialUser!)
          : const LoginScreen(),
    );
  }
}
