import SwiftUI

/// RFC-4180 CSV builder + share. Features map their rows to `[String]`, the kit
/// escapes and writes a temp file, and `KitCSVShareButton` hands it to the
/// system share sheet (`ShareLink`).
///
///   KitCSVShareButton(filename: "sales.csv", label: i18n.t("sales.exportCsv")) {
///       KitCSV.build(headers: ["IMEI", "Price"],
///                    rows: sales.map { [$0.imei, $0.price] })
///   }
enum KitCSV {
    /// Join headers + rows into one escaped CSV document (CRLF line endings).
    static func build(headers: [String], rows: [[String]]) -> String {
        ([headers] + rows)
            .map { $0.map(escape).joined(separator: ",") }
            .joined(separator: "\r\n")
    }

    /// Quote a field only when it must be: comma, quote, CR or LF present.
    /// Internal quotes are doubled.
    static func escape(_ field: String) -> String {
        guard field.contains(where: { $0 == "," || $0 == "\"" || $0 == "\n" || $0 == "\r" })
        else { return field }
        return "\"\(field.replacingOccurrences(of: "\"", with: "\"\""))\""
    }

    /// Write the CSV (BOM-prefixed so Excel reads UTF-8) to a temp file for sharing.
    static func write(_ csv: String, filename: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        var data = Data([0xEF, 0xBB, 0xBF])   // UTF-8 BOM
        data.append(Data(csv.utf8))
        try data.write(to: url, options: .atomic)
        return url
    }
}

/// Builds the CSV file lazily, then shows a native share button for it.
struct KitCSVShareButton: View {
    let filename: String
    let label: String
    let build: () -> String

    @State private var fileURL: URL?

    var body: some View {
        Group {
            if let fileURL {
                ShareLink(item: fileURL) {
                    Label(label, systemImage: "square.and.arrow.up")
                }
            } else {
                ProgressView()
            }
        }
        .task(id: filename) {
            fileURL = try? KitCSV.write(build(), filename: filename)
        }
    }
}
