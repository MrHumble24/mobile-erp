# 0066 — Device model color images

Date: 2026-11-07
Status: Accepted

## Context

Phones come in distinct colorways (e.g. Black, White, Natural Titanium). Previously, `DeviceModel` only stored a single global `imageFileName` (ADR 0031) uploaded after creation. Merchants need the ability to connect optional photos directly to specific phone colors during and after creation on the inventory models panel (`/inventory?tab=models`), falling back to the main photo when unset.

## Decision

- **Data Model**: `device_model_color_images` table (`id`, `modelId`, `color`, `imageFileName`, `createdAt`) with `@@unique([modelId, color])` and foreign key cascade to `device_models`.
- **Classification**: Added to `CATALOG_TABLES` in `data-wipe` before `device_models`.
- **Endpoints**: `POST /device-models/:id/colors/:color/image` and `DELETE /device-models/:id/colors/:color/image` (`device.update`, multipart file, 2 MB max, magic byte validation).
- **Projections**: `DeviceModelView` exposes `colorImages: Record<string, string>`. Public storefront product details also exposes `colorImages` so customer variant selection displays the selected colorway.
- **Client Creation Flow**: In the model dialog, users can stage files for both the main photo and individual color variants during model creation; staged files upload upon model creation.

## Consequences

- Completely optional: colors without a photo continue to fall back to the model's main picture.
- Old files are automatically removed on disk on replacement or deletion.

