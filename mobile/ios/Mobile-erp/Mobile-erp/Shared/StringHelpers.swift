import Foundation

/// Stack-level String conveniences shared across slices (no business meaning):
/// trimming and operator-entered-money parsing. Promoted here so slices don't
/// each redeclare them (which collides in the single app module).
extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    var trimmedOrNil: String? { let t = trimmed; return t.isEmpty ? nil : t }
    /// Operator-entered money → exact Decimal (nil when blank/invalid).
    var asDecimal: Decimal? { Decimal(string: trimmed) }
}
