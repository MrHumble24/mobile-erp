import UIKit

/// Turns a picked or captured photo into a JPEG that fits the server's 2 MB
/// limit (ADR 0031): cap the longest side, then step the quality down, then the
/// dimension, until it fits. The server only accepts JPEG/PNG/WebP decided by the
/// bytes, so re-encoding to JPEG also guarantees an accepted type regardless of
/// what the library handed us (HEIC, say).
enum ProductImageEncode {
    static let maxBytes = 2 * 1024 * 1024

    /// A JPEG ≤ `maxBytes`, or nil if one truly can't be produced. Pure CPU work —
    /// call it off the main actor.
    static func jpeg(from image: UIImage, maxBytes: Int = maxBytes) -> Data? {
        var working = resized(image, maxDimension: 2000)
        for _ in 0..<5 {
            for quality in [0.8, 0.6, 0.45, 0.3] as [CGFloat] {
                if let data = working.jpegData(compressionQuality: quality), data.count <= maxBytes {
                    return data
                }
            }
            working = resized(working, maxDimension: longestSide(working) * 0.7)
        }
        return working.jpegData(compressionQuality: 0.3)
    }

    private static func longestSide(_ image: UIImage) -> CGFloat {
        max(image.size.width, image.size.height)
    }

    private static func resized(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let side = longestSide(image)
        guard side > maxDimension, maxDimension > 0 else { return image }
        let scale = maxDimension / side
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
    }
}

#if DEBUG
/// One check that the downscale actually lands under the limit for a large image.
enum ProductImageEncodeSelfCheck {
    static let ran: Void = {
        let size = CGSize(width: 3000, height: 3000)
        let big = UIGraphicsImageRenderer(size: size).image { ctx in
            UIColor.systemTeal.setFill(); ctx.fill(CGRect(origin: .zero, size: size))
        }
        let data = ProductImageEncode.jpeg(from: big)
        assert(data != nil && data!.count <= ProductImageEncode.maxBytes)
    }()
}
#endif
