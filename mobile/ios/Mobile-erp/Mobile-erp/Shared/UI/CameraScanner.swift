import SwiftUI
import VisionKit

/// VisionKit camera scanner, bridged for SwiftUI. Presented in a sheet by
/// `ScannerField`. Recognizes 1D barcodes, QR/2D codes and printed IMEI numbers
/// (on-device OCR filtered by `ImeiText`), reporting the first hit via `onScan`.
/// Caller guards `DataScannerViewController.isSupported` before use.
struct CameraScanner: UIViewControllerRepresentable {
    let onScan: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onScan: onScan) }

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode(), .text()],
            qualityLevel: .balanced,
            isHighFrameRateTrackingEnabled: false,
            isPinchToZoomEnabled: true,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ scanner: DataScannerViewController, context: Context) {
        try? scanner.startScanning()
    }

    static func dismantleUIViewController(_ scanner: DataScannerViewController, coordinator: Coordinator) {
        scanner.stopScanning()
    }

    @MainActor
    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        private let onScan: (String) -> Void
        private var fired = false

        init(onScan: @escaping (String) -> Void) { self.onScan = onScan }

        func dataScanner(_ scanner: DataScannerViewController, didAdd items: [RecognizedItem], allItems: [RecognizedItem]) {
            handle(items)
        }

        /// OCR text refines across frames, so a number may only become readable on update.
        func dataScanner(_ scanner: DataScannerViewController, didUpdate items: [RecognizedItem], allItems: [RecognizedItem]) {
            handle(items)
        }

        private func handle(_ items: [RecognizedItem]) {
            guard !fired else { return }
            guard let value = items.lazy.compactMap(Self.barcode).first
                ?? items.lazy.compactMap(Self.imei).first else { return }
            fired = true
            onScan(value)
        }

        private static func barcode(_ item: RecognizedItem) -> String? {
            guard case let .barcode(code) = item, let value = code.payloadStringValue,
                  !value.isEmpty else { return nil }
            return value
        }

        private static func imei(_ item: RecognizedItem) -> String? {
            guard case let .text(text) = item else { return nil }
            return ImeiText.find(in: text.transcript)
        }
    }
}
