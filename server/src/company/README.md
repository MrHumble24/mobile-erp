# company

Company profile, shop branding, and theme configuration (ADR 0054, ADR 0055).

## Exposes (HTTP)

- `GET /branding` (public, cached): company name, logo address, theme code,
  default language, currency formatting. Read by sign-in and public pages.
- `GET /themes` (public): list of active system themes.
- `GET /company` (`settings.manage`): full company profile with active themes.
- `PATCH /company` (`settings.manage`): update company details, currency, theme.
- `POST /company/logo` (`settings.manage`): multipart logo upload (PNG/JPG/WebP,
  checked by magic bytes, max 2 MB).

## Exposes (Internal Service)

- `CompanyService.getBranding()`
- `CompanyService.getSessionDuration()` (fallback to `JWT_EXPIRES_IN ?? '12h'`)
- `CompanyService.getTimeZone()` (fallback to `'Asia/Tashkent'`)
- `CompanyService.getCurrency()`

## Must never

- Accept SVG uploads (executable script risk).
- Return secrets or sensitive credentials.
