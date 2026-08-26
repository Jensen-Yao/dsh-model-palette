# Changelog

## 0.3.0 - 2026-08-26

- Replace conversation-based media shortcuts with a direct same-origin plugin API.
- Load the full live OpenRouter image/video catalog, label current pricing, and disable paid entries while paid generation is blocked.
- Run image generation, video submission, status checks, and downloads without adding chat messages.
- Keep all five agent tools and the existing paid-generation guards available for model-driven workflows.

## 0.2.0 - 2026-08-26

- Add an OpenRouter media shortcut panel to the model palette.
- Send structured free-only image and video requests through the current DSH conversation without exposing credentials to the browser.
- Add quick actions for model discovery, video status, and completed-video downloads.

## 0.1.2 - 2026-08-26

- Make browser bundles reproducible across Windows and Linux by using project-relative virtual CSS module IDs and normalized CSS line endings.

## 0.1.1 - 2026-08-26

- Accept the DSH `0.1.1-rc` client packages through explicit prerelease peer ranges.

## 0.1.0 - 2026-08-26

- Add the global `Alt+M` model command palette.
- Add provider filtering and provider/model fuzzy search.
- Add current, favorite, and recent route ranking.
- Add reasoning-effort selection for capable models.
- Add optional OpenRouter image and video tools with paid generation blocked by default.
