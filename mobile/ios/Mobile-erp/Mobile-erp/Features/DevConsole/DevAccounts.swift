import SwiftUI

/// Pre-configured development and test user credentials for the Malika Bazaar test environment.
struct DevAccount: Identifiable, Sendable {
    let id: String
    let label: String
    let roleName: String
    let email: String
    let password: String
    let badgeColor: Color
    let icon: String
}

enum DevAccounts {
    static let all: [DevAccount] = [
        DevAccount(
            id: "owner",
            label: "Owner (Admin)",
            roleName: "Store Owner / Full Admin",
            email: "owner@malika.uz",
            password: "Mb-n2yyUZbS6gX0FJL9",
            badgeColor: Tokens.signalBlue,
            icon: "crown.fill"
        ),
        DevAccount(
            id: "cashier",
            label: "Cashier",
            roleName: "POS Counter & Consignments",
            email: "cashier@malika.uz",
            password: "Mb-cBbRZWbdB7bm9pGu",
            badgeColor: Tokens.success,
            icon: "cart.fill"
        ),
        DevAccount(
            id: "qc",
            label: "QC Specialist",
            roleName: "Device Inspection & Grading",
            email: "qc@malika.uz",
            password: "Mb-dug8wKXNx8PfEpK2",
            badgeColor: Tokens.warning,
            icon: "checkmark.shield.fill"
        )
    ]
}
