# Flutter & Plugin ProGuard Rules
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# SharedPreferences
-keep class io.flutter.plugins.sharedpreferences.** { *; }
-dontwarn io.flutter.plugins.sharedpreferences.**

# Kotlin Coroutines
-keep class kotlin.coroutines.** { *; }
-keep class kotlinx.coroutines.** { *; }

# CameraX (Required for Camera & Scanner Preview in Release APK)
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

# ML Kit Barcode dependencies
-keep class com.google.android.gms.internal.mlkit_vision_barcode.** { *; }
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**
-dontwarn com.google.android.gms.internal.mlkit_vision_barcode.**

# Mobile Scanner
-keep class dev.steenbakker.mobile_scanner.** { *; }
-dontwarn dev.steenbakker.mobile_scanner.**

# Geolocator
-keep class com.baseflow.geolocator.** { *; }
-dontwarn com.baseflow.geolocator.**

# Device Info
-keep class dev.fluttercommunity.plus.device_info.** { *; }
-dontwarn dev.fluttercommunity.plus.device_info.**
