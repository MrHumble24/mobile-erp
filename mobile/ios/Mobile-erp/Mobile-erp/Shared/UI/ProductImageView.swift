import SwiftUI

/// Draws a product picture from a server `imageUrl` (a `/uploads/...` path, ADR
/// 0031) resolved against the current API base, or a neutral placeholder when
/// there is none. One shared view so the till grid, the unit picker and the
/// product list all read the same. Backed by `ProductImageLoader`: a decoded
/// in-memory cache plus `URLCache` on disk, so a scrolled grid stays smooth and
/// pictures already seen show offline (`/uploads` is served immutable + public,
/// no token on the `<img>`).
struct ProductImageView: View {
    let path: String?
    var cornerRadius: CGFloat = Tokens.Radius.controls

    @Environment(AppContainer.self) private var container
    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(Tokens.surface2)
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                Image(systemName: "photo")
                    .font(.system(size: 22, weight: .regular))
                    .foregroundStyle(Tokens.muted)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .task(id: resolvedURL) { await load() }
    }

    /// The absolute URL this view should show, or nil when there is no picture.
    private var resolvedURL: URL? {
        guard let path, !path.isEmpty else { return nil }
        return URL(string: path, relativeTo: container.devConfig.baseURL)?.absoluteURL
    }

    private func load() async {
        image = nil
        failed = false
        guard let url = resolvedURL else { return }
        if let loaded = await ProductImageLoader.shared.image(for: url) {
            image = loaded
        } else {
            failed = true
        }
    }
}

/// Loads and caches product pictures. Decoded images live in an `NSCache`
/// (memory); the raw bytes live in `URLCache` (memory + disk) via a
/// `returnCacheDataElseLoad` request, so a picture already fetched renders
/// instantly and keeps working offline. The project has no third-party packages,
/// so this is the whole loader.
final class ProductImageLoader: Sendable {
    static let shared = ProductImageLoader()

    private let memory = NSCache<NSURL, UIImage>()
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.urlCache = .shared
        config.requestCachePolicy = .returnCacheDataElseLoad
        session = URLSession(configuration: config)
    }

    func image(for url: URL) async -> UIImage? {
        if let cached = memory.object(forKey: url as NSURL) { return cached }
        var request = URLRequest(url: url)
        request.cachePolicy = .returnCacheDataElseLoad
        guard let (data, _) = try? await session.data(for: request),
              let image = UIImage(data: data) else { return nil }
        memory.setObject(image, forKey: url as NSURL)
        return image
    }
}
