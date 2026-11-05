import Foundation

/// The device-code lookup answer (ADR 0031, `GET /lookup`). The lists tell us a
/// reference (brand/model + optional colour/storage/ram) and, when they can, our
/// catalog product so intake preselects it. `source` credits the free list.
struct LookupResult: Decodable {
    let source: LookupSource
    let reference: LookupReference
    let product: LookupProduct?
}

struct LookupSource: Decodable {
    let name: String
    let license: String
}

struct LookupReference: Decodable {
    let brand: String
    let model: String
    let color: String?
    let storage: String?
    let ram: String?
}

/// Our catalog product the lists point at, when one is known.
struct LookupProduct: Decodable {
    let modelId: String
    let brand: String
    let name: String
    let kindCode: String
    /// "link" | "modelCode" | "name" | "manual" — how it was matched (informational).
    let matchedBy: String
    /// The product's own option matching the reference storage/colour, or nil.
    let storageOption: String?
    let colorOption: String?

    init(modelId: String, brand: String, name: String, kindCode: String,
         matchedBy: String, storageOption: String?, colorOption: String?) {
        self.modelId = modelId; self.brand = brand; self.name = name
        self.kindCode = kindCode; self.matchedBy = matchedBy
        self.storageOption = storageOption; self.colorOption = colorOption
    }
}

/// `POST /lookup/links` body — remember which product a reference model is.
struct TeachLinkBody: Encodable {
    let refBrand: String
    let refModel: String
    let modelId: String
}
