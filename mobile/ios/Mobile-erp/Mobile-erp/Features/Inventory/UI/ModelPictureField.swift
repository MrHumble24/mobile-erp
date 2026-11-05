import SwiftUI
import PhotosUI

/// The product picture control in the model form (ADR 0031): shows the current
/// picture (or a placeholder), picks one from the photo library or the camera,
/// replaces and removes it. The photo is downscaled to a JPEG under 2 MB before
/// upload; the server's 400 (not an image) and 413 (too large) map to clear
/// messages. Online-only — upload is a plain write.
struct ModelPictureField: View {
    let modelId: String
    let store: InventoryStore

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var imageUrl: String?
    @State private var photoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var busy = false

    init(model: DeviceModelView, store: InventoryStore) {
        self.modelId = model.id
        self.store = store
        _imageUrl = State(initialValue: model.imageUrl)
    }

    var body: some View {
        AppFormField(label: i18n.t("catalog.picture")) {
            HStack(alignment: .top, spacing: Tokens.Space.md) {
                ProductImageView(path: imageUrl)
                    .frame(width: 84, height: 84)
                VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                    PhotosPicker(selection: $photoItem, matching: .images) {
                        Label(imageUrl == nil ? i18n.t("catalog.uploadPicture") : i18n.t("catalog.replacePicture"),
                              systemImage: "photo.on.rectangle")
                    }
                    .buttonStyle(.pillSecondary)
                    if CameraPhotoPicker.isAvailable {
                        Button { showCamera = true } label: {
                            Label(i18n.t("catalog.uploadPicture"), systemImage: "camera")
                        }
                        .buttonStyle(.pillGhost)
                    }
                    if imageUrl != nil {
                        Button(role: .destructive) { Task { await remove() } } label: {
                            Label(i18n.t("catalog.removePicture"), systemImage: "trash")
                        }
                        .buttonStyle(.pillGhost)
                        .foregroundStyle(Tokens.danger)
                    }
                    Text(i18n.t("catalog.pictureHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
            .disabled(busy)
        }
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task { await pick(item) }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPhotoPicker { image in Task { await upload(image) } }
                .ignoresSafeArea()
        }
        #if DEBUG
        .task { _ = ProductImageEncodeSelfCheck.ran }
        #endif
    }

    private func pick(_ item: PhotosPickerItem) async {
        defer { photoItem = nil }
        guard let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data) else {
            container.toasts.error(i18n.t("catalog.errorPictureType")); return
        }
        await upload(image)
    }

    private func upload(_ image: UIImage) async {
        guard container.connectivity.isOnline else {
            container.toasts.error(i18n.t("common.offline", default: "Offline")); return
        }
        guard let jpeg = ProductImageEncode.jpeg(from: image) else {
            container.toasts.error(i18n.t("catalog.errorPictureSize")); return
        }
        busy = true
        defer { busy = false }
        do {
            let updated = try await DeviceModelRepository(container).uploadImage(id: modelId, jpeg: jpeg)
            imageUrl = updated.imageUrl
            await store.loadModels()
            container.toasts.success(i18n.t("catalog.pictureSaved"))
        } catch let e as AppError {
            container.toasts.error(message(for: e))
        } catch {
            container.toasts.error(i18n.t("common.error"))
        }
    }

    private func remove() async {
        guard container.connectivity.isOnline else {
            container.toasts.error(i18n.t("common.offline", default: "Offline")); return
        }
        busy = true
        defer { busy = false }
        do {
            try await DeviceModelRepository(container).removeImage(id: modelId)
            imageUrl = nil
            await store.loadModels()
            container.toasts.success(i18n.t("catalog.pictureRemoved"))
        } catch {
            container.toasts.error(i18n.t("common.error"))
        }
    }

    /// 413 → too large, 400 → not an image; else the server's own message.
    private func message(for e: AppError) -> String {
        switch e.statusCode {
        case 413: return i18n.t("catalog.errorPictureSize")
        case 400: return i18n.t("catalog.errorPictureType")
        default: return e.message
        }
    }
}
