# Changelog

## 0.5.2 - 2026-08-27

- Add live protocol probing for OpenAI-compatible providers.
- Test `/chat/completions` and `/responses` with a minimal request and show the result in the configuration panel.
- Keep protocol selection manual; only offer one-click adoption when exactly one protocol succeeds.
- Keep stored credentials on the plugin backend and require confirmation before the live probe.

## 0.5.1 - 2026-08-27

- Detect known DeepSeek-dialect models served through custom `openai-completions` gateways.
- Repair missing `thinkingFormat`, assistant `reasoning_content` replay, and developer-role compatibility without overriding manual values.
- Run the repair preflight automatically before selecting an affected model.
- Show affected models in the configuration panel and provide one-click repair and apply.
- Add focused tests for BankOfAI-style routes, ordinary models, manual overrides, and selection-time settings writes.

## 0.5.0 - 2026-08-26

- Add Favorites only and Recent models quick filters to the global palette.
- Add provider duplication with an automatically separated credential reference.
- Add model parameter duplication and model-list filtering for long provider catalogs.
- Reject duplicate model IDs before settings writes.
- Warn before discarding dirty configuration drafts and before browser unload.
- Add confirmed provider deletion that keeps the associated credential intact.
- Update the English and Chinese README usage guides.

## 0.4.0 - 2026-08-26

- Add a provider and model configuration panel beside the model and media views.
- Write provider profiles through DSH `settings.mutate` and keys through `credentials.set`, with live endpoint discovery through `llm.discoverModels`.
- Add bundled and GitHub-refreshable model presets for verified context windows, maximum outputs, and text/image input support.
- Keep API keys masked by default; allow loading a stored key only over direct loopback access and reject LAN or reverse-proxy reveal attempts.
- Expose common per-model OpenAI compatibility switches without discarding existing advanced fields.
- Render the command dialog through a document-level portal so skins that hide the native composer controls cannot hide the palette.

## 0.3.1 - 2026-08-26

- Keep models without a detected free price selectable in the media panel.
- Require an explicit one-time possible-charge acknowledgement before each manually overridden image or video request.
- Keep the manual override out of agent tool schemas so models cannot bypass the configured paid-generation guard.

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
