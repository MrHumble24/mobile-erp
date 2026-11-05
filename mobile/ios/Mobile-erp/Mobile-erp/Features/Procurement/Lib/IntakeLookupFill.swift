import Foundation

/// Fills intake specs from a lookup result (ADR 0031): storage and colour, and
/// only when the field is still empty — it never overwrites what the person
/// typed. Pure, so the DEBUG self-check can prove the "only empty fields" rule.
enum IntakeLookupFill {
    static func apply(current specs: [String: String], storage: String?, color: String?) -> [String: String] {
        var out = specs
        if (out["storage"] ?? "").isEmpty, let storage, !storage.isEmpty { out["storage"] = storage }
        if (out["color"] ?? "").isEmpty, let color, !color.isEmpty { out["color"] = color }
        return out
    }
}

#if DEBUG
enum IntakeLookupFillSelfCheck {
    static let ran: Void = {
        // Empty fields are filled.
        let filled = IntakeLookupFill.apply(current: [:], storage: "256 GB", color: "Black")
        assert(filled["storage"] == "256 GB" && filled["color"] == "Black")
        // A field the person already typed is never overwritten.
        let kept = IntakeLookupFill.apply(current: ["storage": "128 GB"], storage: "256 GB", color: "Blue")
        assert(kept["storage"] == "128 GB" && kept["color"] == "Blue")
        // Nothing from the lists → nothing added.
        assert(IntakeLookupFill.apply(current: [:], storage: nil, color: nil).isEmpty)
    }()
}
#endif
