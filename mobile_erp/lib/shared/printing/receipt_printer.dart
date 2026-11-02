import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// One printed line: a left label with an optional right-aligned value.
class ReceiptRow {
  const ReceiptRow(this.left, [this.right, this.bold = false]);
  final String left;
  final String? right;
  final bool bold;
}

/// Sends a 58mm thermal-style receipt to the OS print service. Works on mobile
/// (AirPrint / Android print) and desktop (system print dialog) through one
/// `printing` call — no per-platform code.
///
/// ponytail: system print over raw ESC-POS bytes + Bluetooth pairing. Upgrade
/// to `esc_pos_utils` + a BT transport only when a dedicated thermal printer
/// needs byte-level control (cut, drawer kick, logo bitmap).
Future<void> printReceipt({
  required String title,
  required List<String> headerLines,
  required List<ReceiptRow> rows,
  required List<String> footerLines,
}) {
  return Printing.layoutPdf(
    onLayout: (_) async {
      final doc = pw.Document();
      final mono = pw.Font.courier();
      final monoBold = pw.Font.courierBold();
      doc.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.roll57,
          margin: const pw.EdgeInsets.all(8),
          build: (_) => pw.DefaultTextStyle(
            style: pw.TextStyle(font: mono, fontSize: 9),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                pw.Center(
                  child: pw.Text(title,
                      style: pw.TextStyle(font: monoBold, fontSize: 11)),
                ),
                for (final line in headerLines) pw.Center(child: pw.Text(line)),
                pw.Divider(),
                for (final row in rows) _row(row, mono, monoBold),
                pw.Divider(),
                for (final line in footerLines) pw.Center(child: pw.Text(line)),
              ],
            ),
          ),
        ),
      );
      return doc.save();
    },
  );
}

pw.Widget _row(ReceiptRow row, pw.Font mono, pw.Font monoBold) {
  final style = pw.TextStyle(font: row.bold ? monoBold : mono, fontSize: 9);
  if (row.right == null) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1),
      child: pw.Text(row.left, style: style),
    );
  }
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(vertical: 1),
    child: pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Expanded(child: pw.Text(row.left, style: style)),
        pw.SizedBox(width: 6),
        pw.Text(row.right!, style: style),
      ],
    ),
  );
}
