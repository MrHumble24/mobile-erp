import UIKit

/// Sends a plain-text 58mm receipt to the OS print service
/// (`UIPrintInteractionController` → AirPrint / any configured thermal printer).
///
/// Duplicated from the Pos slice on purpose: a slice must not import another
/// slice, and this is a tiny leaf with no business meaning.
enum SalesReceiptPrinting {
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

/// Slice-local input helpers (duplicated from Pos's globals on purpose — a
/// slice must not depend on another slice's symbols).
enum SalesInput {
    /// Trimmed string, or nil when empty — keeps optional keys out of a payload.
    static func orNil(_ value: String?) -> String? {
        let trimmed = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    /// Parse the money string exactly (never via a Double literal).
    static func money(_ value: String) -> Double {
        NSDecimalNumber(decimal: Decimal(string: value.trimmingCharacters(in: .whitespaces)) ?? .zero).doubleValue
    }
}

/// Short date helpers for sales views.
/// Date display lives in the kit (`KitDate`); the old name stays for the sales call sites.
typealias SaleDate = KitDate
