import UIKit

/// Sends a plain-text 58mm receipt to the OS print service
/// (`UIPrintInteractionController` → AirPrint / any configured thermal printer).
///
/// ponytail: system print over raw ESC-POS bytes + Bluetooth pairing. Upgrade to
/// a BT transport only when a dedicated thermal printer needs byte-level control
/// (cut, drawer kick, logo bitmap).
///
/// Duplicated in the Sales slice's `ReceiptPrinting` on purpose: a slice must not
/// import another slice, and this is a tiny leaf with no business meaning.
enum ReceiptPrinting {
    static func print(_ text: String, jobName: String) {
        let controller = UIPrintInteractionController.shared
        let info = UIPrintInfo(dictionary: nil)
        info.jobName = jobName
        info.outputType = .general
        controller.printInfo = info

        let formatter = UISimpleTextPrintFormatter(text: text)
        formatter.font = UIFont(name: "Sometype Mono", size: 11)
            ?? .monospacedSystemFont(ofSize: 11, weight: .regular)
        controller.printFormatter = formatter
        controller.present(animated: true, completionHandler: nil)
    }

    static func copy(_ text: String) {
        UIPasteboard.general.string = text
    }
}
