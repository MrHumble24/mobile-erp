import SwiftUI
import VisionKit

/// VisionKit camera barcode scanner, bridged for SwiftUI. Presented in a sheet
/// by `ScannerField`. Recognizes 1D/2D barcodes and reports the first value via
/// `onScan`. Caller guards `DataScannerViewController.isSupported` before use.
struct CameraScanner: UIViewControllerRepresentable {
    let onScan: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onScan: onScan) }

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode()],
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

        private func handle(_ items: [RecognizedItem]) {
            guard !fired else { return }
            for case let .barcode(barcode) in items {
                if let value = barcode.payloadStringValue, !value.isEmpty {
                    fired = true
                    onScan(value)
                    return
                }
            }
        }
    }
}
