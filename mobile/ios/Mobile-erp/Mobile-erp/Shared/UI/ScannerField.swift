import SwiftUI
import VisionKit

/// Scan input that works with a hardware HID scanner (keyboard-wedge: types the
/// code + Enter) AND the phone camera. The visible field lets cashiers type or
/// paste an IMEI too. `onScan` fires on submit or a camera detection, with a
/// 1.2s duplicate-scan debounce (wedges and the camera can double-fire).
///
/// The camera button appears only where VisionKit's `DataScannerViewController`
/// is supported and available; on the simulator it's hidden and HID still works.
struct ScannerField: View {
    var placeholder: String = ""
    let onScan: (String) -> Void

    @State private var text = ""
    @State private var showCamera = false
    @State private var lastCode: String?
    @State private var lastAt: Date?
    @FocusState private var focused: Bool

    private static let dedupeWindow: TimeInterval = 1.2

    private var cameraSupported: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "barcode.viewfinder")
                .font(.system(size: 18))
                .foregroundStyle(focused ? Tokens.ring : .secondary)
            TextField(placeholder, text: $text)
                .font(.mono(15, weight: .medium))
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
                .focused($focused)
                .submitLabel(.done)
                .onSubmit { submit(text) }
            if !text.isEmpty {
                Button {
                    text = ""
                    focused = true
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear text")
            }
            if cameraSupported {
                Button { showCamera = true } label: {
                    Image(systemName: "camera")
                }
                .buttonStyle(.bordered)
                .accessibilityLabel("Scan with camera")
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous)
                .strokeBorder(focused ? Tokens.ring.opacity(0.6) : Tokens.hairline, lineWidth: 1)
        )
        .animation(.snappy(duration: 0.2), value: focused)
        .onAppear { focused = true }
        .sheet(isPresented: $showCamera) {
            CameraScanner { code in
                showCamera = false
                submit(code)
            }
            .ignoresSafeArea()
        }
    }

    private func submit(_ raw: String) {
        let code = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        text = ""
        focused = true
        guard !code.isEmpty else { return }
        let now = Date()
        if code == lastCode, let last = lastAt, now.timeIntervalSince(last) < Self.dedupeWindow {
            return   // duplicate scan, ignore
        }
        lastCode = code
        lastAt = now
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        onScan(code)
    }
}
