# Changelog

## 0.21.1 - 2026-11-13

- Craft pass over the palette: capacity badges settle into quiet tabular text that only gains a pill on hover/cursor/current rows (free stays green), row metadata demotes provider names and sets the model id in monospace, and the rail's active item gains a visible 3px brand indicator bar.
- Balance the footer by presenting the current model as a bordered chip matching the effort control's weight, soften the search focus ring, go borderless on filter selects, and give group headers real breathing room.
- Fix double highlight on the config tool when the catalog view is open; the reasoning "R" marker now carries a tooltip. Regression-audited all 0.20/0.21 features (drag resizer, collapsible groups, refresh buttons, keyboard navigation, five tool views, 620px narrow layout).

## 0.21.0 - 2026-11-13

- Guarantee the keyless free lane is visible: the plugin now serves `GET /model-palette/api/free-models/snapshot`, and the palette merges that runtime group into the directory when a DSH build does not surface adapter-registered providers — the lane (and its models) become browsable and selectable regardless, with a dedicated green "Free Models" section in the rail.
- Restructure the palette's left rail into three clear zones — Models (all / free / favorites / recents), Configured providers, and a bottom Tools row (config, add, relay, media, quick profiles) — replacing the previous flat button pile; all tool icons are now monochrome SVG.
- Reshape the reasoning-effort control into a Codex-style segmented meter: each stop renders an ascending signal-strength bar ladder with its level filled, the active stop carries the brand highlight, and arrow keys move between stops.

## 0.20.0 - 2026-11-13

- Keep the keyless free lane current: every probe interval now re-reads the Kilo and OpenCode catalogs, and provider rows with free models (plus the free lane itself) get an inline refresh button served by `POST /model-palette/api/free-models/refresh` with an added/removed summary.
- Enrich free-model capabilities from the public models.dev catalog (cached 12h, force-refresh on demand) instead of relying on hardcoded family regexes, filling context windows, output limits, reasoning ladders, and display names the upstream listings omit; OpenRouter free imports and auto-sync now prefill reasoning efforts for catalog-declared reasoning models.
- Make the free lane discoverable: it is pinned below the current provider in the rail and results with a localized name, a gift icon, and a FREE pill; the free capability filter and `免费` search now cover the keyless lane, not only `:free` suffix routes.
- Replace the reasoning-effort range slider with a diagram-style segmented control (per-stop intensity glyphs, animated thumb, radio semantics, arrow-key support) in both the composer seat and the palette footer.
- The provider rail is wider by default and drag-resizable (double-click resets; width persists), and long model lists group by provider with sticky collapsible headers instead of a duplicated chip strip.

## 0.19.1 - 2026-11-09

- Implement the DSH adapter `providerRetryPolicy` hook and cover it through registration. Version 0.19.0 failed plugin activation on the installed DSH runtime because this method was missing.

## 0.19.0 - 2026-11-09

- Add the keyless Kilo and OpenCode free-model lanes as a native `dsh-free-models` provider. Kilo rows must be marked free by its catalog; OpenCode keeps its explicit free ids and public-pool wire.
- Serve `/v1/models` and `/v1/chat/completions` on a loopback-only OpenAI-compatible gateway, with optional bearer credential enforcement and both streaming and JSON responses.
- Probe free models with bounded requests, retain unknown/transient failures, and remove a model only after an explicit routing refusal. Runtime failures update the same membership immediately.
- Detect SSE from response body bytes even when a gateway labels the stream as JSON, preserve those first bytes in the parser, and fold a complete JSON response into one stream event.

## 0.18.0 - 2026-11-09

- Add named browser-local model/reasoning profiles with composer buttons, Alt+Shift+1/2/3, reorder, rename, current-selection updates and delete/undo. Preserve unavailable profiles and report storage failures.
- Add a previous-model button and Alt+Shift+M that retain the previous reasoning effort. Share selection preparation, locking and duplicate-request protection across palette rows, effort controls and shortcuts.
- Match compact and full-width model spellings, free/reasoning terms and @provider queries; rank precise search matches first and add a complete filter reset.
- Guard dirty provider drafts when closing the palette or navigating through its sidebar, and retain the editor when moving between configuration and templates.
- Group configured providers by endpoint, show protocol branches as compact route chips, use friendly protocol names, and add needs-key/free-sync filters.

## 0.17.0 - 2026-11-09

- Complete the DSH 0.1 settings bridge and use resolved entry ids for DSH 0.2 reads, discovery and revision-checked edits; reject ambiguous namespace matches.
- Add selected-provider JSON backups and batch import previews with skip, field-merge and copy modes. Omit credentials, request headers, credential-bearing URLs and sync diagnostics; report partially saved imports explicitly.
- Add reasoning/free-route filters, name/provider sorting, 80-row progressive results and live capacity lookup for displayed models. Trap modal focus, restore it on close and ignore IME composition keys.
- Abort pending free-model catalog requests during disposal, preserve edits made during retrieval, reject empty catalogs, contain scheduled read failures and honor zero-hour startup/manual-only schedules.
- Remove unconditional synchronous debug-file writes and the unowned delayed diagnostic probe. Make the free-sync tests keyless and deterministic, and add a local browser smoke fixture.
- Align the development Cordis runtime with DSH 0.2.1-alpha.1 and explicitly admit supported alpha tuples in peer ranges.

## 0.15.1 - 2026-09-20

- OpenRouter media tools are now zero-config and enabled by default: they reuse the OPENROUTER_API_KEY already stored in DSH credentials (the same key chat routes use) and write outputs to ~/.dsh/media-output, so the media panel stops erroring with unregistered endpoints on fresh installs. `enabled: false` opts out and every field stays overridable via plugin config.

## 0.15.0 - 2026-09-20

- Preset registry v5 (487 entries): add mainstream coverage the built-in catalog lacks — Doubao Seed family (Seed 2.0 Code Preview 256K/128K, Seed 1.8 / 1.6 / 1.6 Vision 256K/32K text+image, Seed Character, Doubao 1.5 Pro 32K) from the official Volcano Ark model list; Hunyuan A13B (256K/32K) and Vision models from Tencent Cloud docs; Cohere Command A (256K) and the Perplexity Sonar family (Sonar 128K, Sonar Pro / Pro Search 200K) from their model docs.
- Agnes presets (v0.14.1) included: agnes-2.5-flash / 3.0-flash 512K, agnes-2.5-pro / pro-beta 1M, all text+image.
- ERNIE 5.0 and SenseNova 6.7 remain intentionally absent — no verified public context numbers yet; they will land once official docs publish them.

## 0.14.1 - 2026-09-20

- Add four Agnes presets from the official Agnes AI docs: agnes-2.5-flash and agnes-3.0-flash (512K context, 65,536 output, text+image) and agnes-2.5-pro / agnes-2.5-pro-beta (1M context, 65,536 output, text+image); no reasoning-effort guesses are included because the docs define no effort wire values.

## 0.14.0 - 2026-09-19

- Beautification pass: brand-colored provider icons with tinted tiles across the config cards, the add-provider catalog, the palette sidebar rail, and the footer current-model chip.
- Palette sidebar entries gain provider icons and an active-state background; result rows keep their capacity/free/vision badges.
- Polish: thin rounded scrollbars inside the dialog, consistent focus-visible rings, hover lift on provider cards, model summary hover background, and a friendlier empty state.

## 0.13.0 - 2026-09-19

- Cut config-page crowding: retry and free-sync cards fold away, every model row collapses to a summary line (id, capacity badges, vision/free/preset markers) with the editor revealed on demand, and lists above 60 models render the first 50 until expanded.
- Add a sticky unsaved-changes bar with save/discard so the save action is reachable in long lists, and an empty-state card that routes new users straight to the add-provider catalog.
- Provider cards now show a credential health dot (configured / missing / none) resolved with a single credentials describe call, and the add-provider catalog shows live built-in model counts from the runtime catalog instead of hardcoded numbers.
- Palette result rows gain compact capacity badges (context, output, vision, free) from a session-cached live catalog index.

## 0.12.2 - 2026-09-19

- Promote add-provider to a first-class sidebar view: the template catalog renders as its own full page, fully separated from the model-config card; the dashed card inside config jumps to it.
- Rename the palette sidebar entry to All models and add a Configured providers group header above the per-provider list.

## 0.12.1 - 2026-09-19

- Show the reasoning-effort slider as a compact permanent chip next to the composer model trigger, not only inside the Alt+M dialog.
- Slider stops now follow the current model's declared efforts in canonical order: a model without xhigh never offers xhigh, and a non-reasoning model hides the control entirely.
- Add a prominent dashed add-provider card to the provider grid that opens the template catalog dialog, so adding a provider is discoverable without hunting the toolbar.

## 0.12.0 - 2026-09-19

- Rebuild the palette footer reasoning effort control as a Codex-style discrete slider: provider default plus the seven effort levels on one gradient track with per-stop labels.
- Add a visual provider card catalog to the config panel: searchable grid with brand icons, model counts, and protocol badges, plus a template gallery whose built-in catalog templates create zero-config routes (endpoint, protocol, and model list resolve from the DSH built-in catalog).
- Add a **Read model list** action that fetches any provider's live model list into a selective import picker with search, select-visible/unconfigured shortcuts, and automatic capacity, input, and preset enrichment on import.
- Expand the model preset registry to 469 vendor-authoritative entries (registry v4) by also harvesting the Together, Fireworks, Groq, NVIDIA, Hugging Face, Cerebras, Baseten, OpenCode, Bedrock, Azure, and Vertex catalogs.
- Polish config UI styling: card hover states, smoother free-model and import pickers.
- Move the add-provider template gallery into a dedicated search dialog so the provider config card stays uncluttered, and add the Radius route to the catalog.

## 0.11.0 - 2026-09-19

- Target `@deepseek-ai/dsh@0.1.6-alpha.2`: peer ranges and dev dependencies move to the 0.1.6 line, and the composer seat returns the DSH 0.1.6 `RemoteResult` selection outcome instead of a boolean.
- Rebuild the configuration panel's provider picker as a visual catalog: searchable card grid with brand icons, model counts, protocol badges, and a template gallery (custom, OAuth subscription, API-key) that prefills endpoint, protocol, and credential reference.
- Add OpenRouter free-route auto sync: a `freeSync` rule (preset for `openrouter-free`) replaces the provider's model list with the live OpenRouter `:free` catalog on DSH startup and on a configurable interval, keeps manual capacity/compatibility fields on surviving ids, adds DeepSeek replay compatibility automatically, records per-provider sync state, and exposes "sync now" plus on/off controls in the panel.
- Expand the model preset registry to 281 vendor-authoritative entries (version 3) harvested from the DSH 0.1.6 built-in pi-ai catalog — current context windows, output caps, input modalities, and reasoning effort maps for OpenAI, Anthropic, Google, DeepSeek, Moonshot, Z.AI, MiniMax, Qwen, xAI, Xiaomi, OpenRouter exclusives, and more; presets now render through a searchable input instead of a 281-option dropdown.
- Show context window, output cap, and reasoning-level counts inline with each preset selection.

## 0.10.3 - 2026-09-01

- Distinguish API-key authentication failures, provider/WAF blocks, temporary upstream failures, and protocol rejection during live protocol probes.
- Report authentication failures as undetermined protocol support instead of implying that both OpenAI protocols are unsupported.
- Keep all-model protocol scans non-destructive when the shared provider credential fails authentication.

## 0.10.2 - 2026-08-31

- Support `@deepseek-ai/dsh@0.1.2-alpha.3` after the Client runtime was split into dedicated connection, store, session, renderer, and slot packages.
- Read generated settings, credentials, and LLM namespaces from `ctx.remote` instead of the removed `connection.api` facade.
- Replace removed `IApiClient` and `CredentialView` types with the alpha.3 `ClientRemote` and `CredentialInfo` exports.
- Stop injecting or installing the unpublished `@deepseek-ai/dsh-client-runtime` package and require the alpha.3 Client package line.

## 0.10.1 - 2026-08-29

- Include DSH runtime catalog models and `modelOverrides` in single-model and full-provider protocol checks instead of limiting the feature to explicit `models` arrays.
- Preserve catalog-backed profiles as `modelOverrides` for provider-only edits, and materialize the complete catalog only when a model edit or protocol split requires an explicit list.
- Resolve live context windows, configured output caps, and text/image input modalities before creating a `-completions` branch; cancel the split rather than write incomplete model metadata.
- Repair DeepSeek Chat Completions compatibility inside `modelOverrides` and expose catalog-backed models in the configuration panel with a clear materialization notice.

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
