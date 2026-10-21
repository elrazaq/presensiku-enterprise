import 'package:flutter_test/flutter_test.dart';
import 'package:presensiku_mobile/main.dart';

void main() {
  testWidgets('PresensiKuApp widget smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const PresensiKuApp());

    // Verify that PresensiKuApp builds successfully.
    expect(find.byType(PresensiKuApp), findsOneWidget);
  });
}
