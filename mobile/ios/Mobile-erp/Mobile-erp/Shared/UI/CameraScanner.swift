import SwiftUI
import VisionKit

/// Camera scan screen presented in a sheet by `ScannerField`. Barcodes, QR codes
/// and printed IMEIs fire `onScan` on their own; any other printed number shows
/// as a button along the bottom for the user to tap.
/// Caller guards `DataScannerViewController.isSupported` before use.
struct CameraScanner: View {
    let onScan: (String) -> Void

    @State private var numbers: [String] = []
    private static let maxNumbers = 8

    var body: some View {
        CameraScannerController(onScan: onScan, onNumbers: remember)
            .safeAreaInset(edge: .bottom) {
                if !numbers.isEmpty { numberBar }
            }
    }

    private var numberBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(numbers, id: \.self) { number in
                    Button(number) { onScan(number) }
                        .font(.mono(15))
                        .buttonStyle(.bordered)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(.regularMaterial)
    }

    /// Newest first, capped, so the bar stays steady while OCR jitters frame to frame.
    private func remember(_ seen: [String]) {
        var unique = Set<String>()
        numbers = Array((seen + numbers).filter { unique.insert($0).inserted }.prefix(Self.maxNumbers))
    }
}

/// VisionKit `DataScannerViewController` bridged for SwiftUI (barcodes + on-device OCR).
private struct CameraScannerController: UIViewControllerRepresentable {
    let onScan: (String) -> Void
    let onNumbers: ([String]) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onScan: onScan, onNumbers: onNumbers) }

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
        private let onNumbers: ([String]) -> Void
        private var fired = false

        init(onScan: @escaping (String) -> Void, onNumbers: @escaping ([String]) -> Void) {
            self.onScan = onScan
            self.onNumbers = onNumbers
        }

        func dataScanner(_ scanner: DataScannerViewController, didAdd items: [RecognizedItem], allItems: [RecognizedItem]) {
            handle(items)
        }

        /// OCR text refines across frames, so a number may only become readable on update.
        func dataScanner(_ scanner: DataScannerViewController, didUpdate items: [RecognizedItem], allItems: [RecognizedItem]) {
            handle(items)
        }

        private func handle(_ items: [RecognizedItem]) {
            guard !fired else { return }
            let texts = items.compactMap(Self.transcript)
            if let value = items.lazy.compactMap(Self.barcode).first
                ?? texts.lazy.compactMap({ ScanText.imei(in: $0) }).first {
                fired = true
                onScan(value)
                return
            }
            let numbers = texts.flatMap { ScanText.numbers(in: $0) }
            if !numbers.isEmpty { onNumbers(numbers) }
        }

        private static func barcode(_ item: RecognizedItem) -> String? {
            guard case let .barcode(code) = item, let value = code.payloadStringValue,
                  !value.isEmpty else { return nil }
            return value
        }

        private static func transcript(_ item: RecognizedItem) -> String? {
            guard case let .text(text) = item else { return nil }
            return text.transcript
        }
    }
}
