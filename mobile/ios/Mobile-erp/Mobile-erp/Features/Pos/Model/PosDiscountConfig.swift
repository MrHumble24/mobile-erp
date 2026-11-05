import Foundation

/// The discount rules the till needs to stop a seller before the server does
/// (ADR 0034): the shop settings plus the signed-in user's price permissions.
/// Loaded once from `/settings` and the session; `enabled == false` hides the
/// whole discount surface.
struct PosDiscountConfig: Equatable {
    var enabled = false
    var percentAllowed = true
    var amountAllowed = true
    var presetsPercent: [Decimal] = []
    var presetsAmount: [Decimal] = []
    /// The largest discount a cashier may give without the owner, as a percent.
    var cashierMax: Decimal = 0
    /// `sale.price.override`: may type a free price (the gap becomes the discount).
    var canOverridePrice = false
    /// `sale.discount.unlimited`: the cashier ceiling does not apply.
    var canDiscountUnlimited = false

    /// Which discount modes the seller may pick, in display order.
    var allowedModes: [PosDiscountMode] {
        var modes: [PosDiscountMode] = []
        if percentAllowed { modes.append(.percent) }
        if amountAllowed { modes.append(.amount) }
        return modes
    }

    static func from(_ s: StoreSettings, session: Session) -> PosDiscountConfig {
        PosDiscountConfig(
            enabled: s.discountsEnabled,
            percentAllowed: s.discountPercentAllowed,
            amountAllowed: s.discountAmountAllowed,
            presetsPercent: s.discountPresetsPercent.compactMap { Decimal(string: $0) },
            presetsAmount: s.discountPresetsAmount.compactMap { Decimal(string: $0) },
            cashierMax: Decimal(string: s.maxDiscountPercent) ?? 0,
            canOverridePrice: session.can("sale.price.override"),
            canDiscountUnlimited: session.can("sale.discount.unlimited"))
    }
}
