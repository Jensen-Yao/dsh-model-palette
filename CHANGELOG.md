# Changelog

## 0.10.0 - 2026-08-29

- Default newly created OpenAI-compatible provider drafts to `openai-responses` while keeping protocol selection based on real endpoint behavior rather than reasoning capability.
- Add batched live protocol classification for every configured model, with Responses-first, both, Chat Completions-only, and undetermined results.
- Add an explicit **Split Re/CC protocols** action that keeps Responses-capable models on the original provider and creates a collision-safe `-completions` branch for Chat Completions-only models.
- Preserve the Base URL, credential reference, capacities, inputs, reasoning declarations, compatible protocol fields, and provider/model retry rules across generated branches.
- Keep the split preview-only until confirmation, cap each probe at 16 output tokens, batch large catalogs, and never return API keys to the browser.

## 0.9.3 - 2026-08-29

- Keep B.AI failover inside the same provider and model instead of suggesting a provider switch.
- Add a three-step B.AI connection strategy chain: rotating AWS Global Accelerator DNS addresses followed by direct `api.b.ai`.
- Retry transient B.AI HTTP failures, Cloudflare block pages, DNS errors, and socket failures on the next strategy with fresh HTTPS connections.
- Preserve original upstream status and response bodies for non-replayable or terminal failures, and expose the strategy chain in the Relay sidebar and bilingual documentation.

## 0.9.2 - 2026-08-29

- Reopen each relay attempt with a fresh HTTPS socket so an upstream `ECONNRESET` does not immediately surface as a misleading 502.
- Buffer replayable request bodies, retry transient connection failures twice with bounded backoff, and return `503 UPSTREAM_TRANSIENT` with `Retry-After` after exhaustion.
- Keep larger requests available for a single non-replayed attempt and expose relay retry limits in the sidebar templates and documentation.

## 0.9.1 - 2026-08-29

- Pass a mutable copy of the built-in retry defaults to DSH settings so Schemastery can resolve them during plugin startup.

## 0.9.0 - 2026-08-29

- Add live provider-level transient request retry rules with exact per-model overrides in the configuration panel.
- Preset B.AI and BankOfAI route aliases to 50 retries while leaving every unconfigured route on its existing DSH recovery policy.
- Keep permanent authentication, quota, request, missing-model, and context-limit failures terminal; retry only transport, timeout, rate-limit, server, empty-response, and explicit Cloudflare/WAF failures.
- Make configured retry counts exact instead of stacking them with the native DSH retry executor, and show the `N + 1` request/cost warning in the UI.

## 0.8.0 - 2026-08-29

- Add a visible Relay configuration view below Media tools and Model config, with the built-in B.AI route, copyable provider/config templates, request-flow explanation, and diagnostics.
- Add configurable named `providerRelays` so another provider with an unreachable canonical route can use a fixed, loopback-only HTTPS upstream without modifying plugin source.
- Keep configurable relays fail-closed with explicit host, TLS name, certificate name, and allowed-path validation; reject non-loopback and forwarded requests.

## 0.7.2 - 2026-08-29

- Add a loopback-only B.AI relay for networks where `api.b.ai` DNS answers or direct TLS routing are blocked.
- Relay B.AI `/v1/*` requests through the provider's AWS Global Accelerator hostname with the `api.b.ai` host header and certificate-name verification.
- Keep provider credentials in DSH and forward them only from the local DSH process; reject forwarded or non-loopback requests before contacting B.AI.

## 0.7.1 - 2026-08-28

- Split OpenRouter free-model discovery from configuration changes: checking the live catalog no longer imports or removes models automatically.
- Add a searchable free-model picker with visible-result selection, unconfigured-model selection, capacity/input previews, and explicit selected-model import.
- Preserve unselected and expired local entries while filling missing metadata and presets only for models the user chooses.

## 0.7.0 - 2026-08-28

- Add one-click live synchronization of DSH-compatible OpenRouter `:free` text models without requiring or exposing an API key.
- Import current free models with context, maximum output, and text/image input metadata while removing expired `:free` entries and preserving every non-free model.
- Make connection discovery immediately add and enrich models, then fill remaining exact-match capabilities from the bundled or refreshed preset registry.

## 0.6.0 - 2026-08-28

- Retry explicit Cloudflare/WAF 403 block pages with bounded, cancellable backoff after other DSH recovery handlers have had a chance to act.
- Relabel exhausted Cloudflare failures as provider blocking instead of leaving DSH to display them as invalid API keys.
- Add one-click sequential validation for every configured runtime credential, with provider, credential source, protocol, model, diagnostics, and a direct edit action.
- Expose all seven DSH reasoning efforts for the active model and automatically create a live `reasoningEfforts` declaration when the selected model did not advertise them.
- Add per-model reasoning controls, editable provider wire values, provider-aware dispatch defaults, and a one-click action for every declared model on a route.
- Expand the bundled registry to 44 verified model presets and apply known context, output, text/image input, and reasoning metadata without replacing explicit model settings.
- Add provider-default and per-model input selectors for inherited, text-only, text-and-image, and image-only routes.

## 0.5.5 - 2026-08-28

- Raise live protocol and credential fallback probes to a 16-token output cap so gateways with minimum token validation do not produce false negatives.
- Parse structured and double-encoded provider errors before truncating them, keeping protocol diagnostics concise and readable.
- Cover BankOfAI-style `max_tokens > 2` validation and explicit Responses-to-Completions routing errors.
- Validate credentials with the selected model instead of trusting a potentially public `/models` catalog.
- Report the active DSH runtime credential separately from a different unsaved key so a valid draft cannot hide a failing conversation credential.
- Exercise the streaming request path used by DSH conversations and classify Cloudflare block pages as gateway rejection instead of invalid credentials.

## 0.5.3 - 2026-08-27

- Add a dedicated API key validation button for provider configuration.
- Prefer the authenticated `/models` endpoint to avoid generation charges, with a minimal model request fallback when the catalog endpoint is unavailable.
- Distinguish invalid credentials, provider or gateway rejection, quota/rate-limit unavailability, and inconclusive endpoint or model errors.
- Validate OpenAI Completions, OpenAI Responses, and Anthropic Messages authentication without returning credentials to the browser.

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
