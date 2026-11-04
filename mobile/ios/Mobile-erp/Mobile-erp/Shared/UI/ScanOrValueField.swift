import SwiftUI

/// A code field that shows a `ScannerField` while empty (scan / type / paste)
/// and, once set, the value in mono with a clear button. Used anywhere a single
/// IMEI-style code is captured in a form (consignment rows, the optional second
/// IMEI on intake / edit), so the scan-or-show pattern lives once.
///
/// `onScan` lets the caller route a scanned code instead of writing it straight
/// into the binding — intake uses it to fill the next empty IMEI slot and defer
/// validation. When nil, a scan just sets the binding (the default).
struct ScanOrValueField: View {
    @Binding var text: String
    var placeholder: String = ""
    /// Forwarded to `ScannerField`: when empty, grab focus as the field appears.
    var autoFocus = false
    var onScan: ((String) -> Void)? = nil

    var body: some View {
        if text.isEmpty {
            ScannerField(placeholder: placeholder, autoFocus: autoFocus) { raw in
                let value = raw.trimmingCharacters(in: .whitespacesAndNewlines)
                if let onScan { onScan(value) } else { text = value }
            }
        } else {
            HStack {
                Text(text).font(.mono(14))
                Spacer()
                Button { text = "" } label: { Image(systemName: "xmark.circle.fill") }
                    .buttonStyle(.plain)
                    .foregroundStyle(Tokens.muted)
            }
        }
    }
}
