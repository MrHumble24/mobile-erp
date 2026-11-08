# PWA Feature (`features/pwa`)

This feature provides Progressive Web Application (PWA) installability, update lifecycle management, and iOS/Android compatibility for Mobile ERP.

## Structure
- `model/use-pwa-install.ts`: Captures `beforeinstallprompt`, tracks standalone display mode, handles iOS Safari install detection, and triggers native installation prompts.
- `model/use-pwa-update.ts`: Integrates with Workbox/VitePWA to detect new app versions in the background, offering instant refresh via `updateApp()`.
- `ui/PwaInstallButton.tsx`: Responsive button/pill for installing the PWA on desktop and mobile. Automatically hides when already installed or running standalone.
- `ui/PwaIosDialog.tsx`: Visual step-by-step guidance modal for iOS Safari users ("Share" -> "Add to Home Screen").
- `ui/PwaUpdateToast.tsx`: Non-blocking floating prompt informing the user when a new version of the app is ready to activate.

## Assets
- Icons located in `client/public/`:
  - `pwa-192x192.png`: Standard 192px icon
  - `pwa-512x512.png`: Standard 512px icon
  - `pwa-maskable-192x192.png`: Maskable 192px icon with safe-zone margin
  - `pwa-maskable-512x512.png`: Maskable 512px icon with safe-zone margin
  - `apple-touch-icon.png`: 180px icon with solid background for iOS
  - `favicon.ico`: Multi-resolution legacy favicon
  - `manifest.webmanifest`: Static standalone manifest fallback (mirrored by server dynamic manifest).

