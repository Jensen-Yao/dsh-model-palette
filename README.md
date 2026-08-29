<div align="center">
  <img src="assets/icon.svg" width="96" height="96" alt="DSH Model Palette" />
  <h1>dsh-model-palette</h1>
  <p>
    <strong>Global provider-aware model command palette for DeepSeek Harness Web</strong>
  </p>
  <p>
    <a href="https://github.com/Jensen-Yao/dsh-model-palette/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
    <a href="https://github.com/Jensen-Yao/dsh-model-palette/releases"><img src="https://img.shields.io/github/v/release/Jensen-Yao/dsh-model-palette" alt="Latest Release" /></a>
    <a href="https://www.npmjs.com/package/dsh-model-palette"><img src="https://img.shields.io/badge/dsh-plugin-4.0.1+-6a4cff" alt="DSH Plugin" /></a>
    <a href="https://github.com/Jensen-Yao/dsh-model-palette/blob/main/README.zh-CN.md"><img src="https://img.shields.io/badge/中文文档-available-07c160" alt="中文文档" /></a>
  </p>
  <p>
    <kbd>Alt+M</kbd> &nbsp;·&nbsp; Fuzzy search &nbsp;·&nbsp; Provider filter &nbsp;·&nbsp; Model config &nbsp;·&nbsp; OpenRouter media
  </p>
</div>

---

**dsh-model-palette** is a plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that replaces the native model selector with a powerful, global command palette. Press **Alt+M** from anywhere in the Web UI — or click the composer trigger — and instantly search, filter, favorite, and switch models across all your providers.

Project site: [jensen-yao.github.io/dsh-model-palette](https://jensen-yao.github.io/dsh-model-palette/)

Current release: [v0.10.0](https://github.com/Jensen-Yao/dsh-model-palette/releases/tag/v0.10.0)

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Global Command Palette
- **<kbd>Alt+M</kbd>** shortcut works from anywhere
- Renders in a document-level dialog independent from the composer layout
- One unified fuzzy search over model names, model IDs, provider names, and provider IDs
- Arrow-key navigation and Enter to select

</td>
<td width="50%">

### 🏷️ Provider Filter Rail
- Side rail lists every provider with live model counts
- Click any provider to filter; click "All providers" to reset
- Current provider auto-highlighted at the top
- Visual indicators for provider catalog errors

</td>
</tr>
<tr>
<td width="50%">

### ⭐ Favorites & Recents
- Star any model to add it to favorites
- Recently used models are ranked first
- Current model always pinned at the top
- Dedicated **Favorites only** and **Recent models** quick filters
- Persisted in `localStorage` across sessions

</td>
<td width="50%">

### 🧠 Universal Reasoning Effort Selector
- The footer always offers `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, and `max`
- If a model does not advertise levels yet, choosing one creates a live `reasoningEfforts` declaration before selection
- Configure every level and provider wire value per model, or enable all declared models on a route with one click
- Provider-aware defaults cover OpenAI, OpenRouter, DeepSeek, Qwen, GLM/Z.AI, Together, and manual gateways

</td>
</tr>
<tr>
<td width="50%">

### ⚙️ Provider & Model Configuration
Add, edit, or remove provider profiles directly from the UI:
- Configure **provider ID**, **display name**, **base URL**, and **protocol** (`openai-completions`, `openai-responses`, `anthropic-messages`)
- New OpenAI-compatible provider drafts default to `openai-responses`
- Classify every configured model with real Responses and Chat Completions requests, then explicitly split Completions-only models into a generated `provider-completions` route
- Set **credential reference** and **API key** (masked by default)
- Validate every configured runtime key in one click and jump directly to any provider that needs editing
- **Test connection** via `llm.discoverModels`; discovered models are immediately added and enriched with live metadata plus exact presets
- On OpenRouter routes, **Check free models** opens a searchable live `:free` catalog so you can select exactly which models to import
- Duplicate a working provider into a new draft with a separate credential reference
- Duplicate model parameters, filter long model lists, and reject duplicate model IDs before saving
- Auto-repair known DeepSeek-dialect replay fields before switching models on custom OpenAI-compatible gateways
- List affected models missing `thinkingFormat` / `reasoning_content` replay settings and provide one-click repair in the config panel
- Configure transient request retries per provider and override them per model; B.AI and BankOfAI aliases start at 50 retries
- Keep unselected routes on their existing DSH recovery policy and never retry permanent 401, quota, request, missing-model, or context-limit failures
- Preserve a gateway-blocked diagnostic when explicit Cloudflare/WAF 403 retries are exhausted
- Open a dedicated Relay config view from the sidebar to inspect the built-in B.AI route, copy current-port loopback templates, and define fixed-destination relays for other providers
- Warn before discarding unsaved edits and protect drafts with a browser unload guard
- Security: stored keys can only be revealed through direct `127.0.0.1` / `localhost` access

</td>
<td width="50%">

### 📦 Model Presets
- **44 bundled presets** for context windows, max outputs, text/vision input types, and known reasoning efforts
- **Online refresh** from GitHub — always up-to-date
- **Auto-fill** missing parameters for exact model matches
- **Manual preset selection** for private gateway aliases
- Provider default input and per-model input can be set to inherit, text, text + image, or image only
- Unknown aliases are never guessed — only verified data is applied

</td>
</tr>
<tr>
<td width="50%">

### 🖼️ OpenRouter Media Tools (Optional)
- **Image generation** — select a model, write a prompt, generate directly
- **Video generation** — submit async jobs with duration control
- **Job management** — check status and download completed videos
- All actions run without sending prompts to the conversation
- **Paid generation blocked** by default; configurable

</td>
<td width="50%">

### 🔒 Safety & Privacy
- API keys masked by default; stored in DSH credentials service
- Credential reveal restricted to loopback connections only
- Cross-site request forgery protection on all plugin APIs
- OpenRouter credential never returned to the browser
- One-time charge acknowledgement for non-free media models

</td>
</tr>
</table>

## 🚀 Quick Start

### Install

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette#v0.10.0
```

Restart `dsh web`, then press **<kbd>Alt+M</kbd>** or click the model trigger in the composer area.

### Enable OpenRouter Media Tools (Optional)

Add a profile patch to enable the optional image/video generation tools:

```yaml
# cordis.patch.yml or your profile patch file
- id: dsh-model-palette
  config:
    openrouterMedia:
      enabled: true
      credentialRef: OPENROUTER_API_KEY
      outputDir: 'D:\AI\openrouter\outputs'
      allowPaidImages: false
      allowPaidVideos: false
      preferredImageModels: []
      preferredVideoModels: []
```

This registers five agent tools:

| Tool | Description |
|------|-------------|
| `openrouter_media_models` | Browse live OpenRouter image/video models and pricing |
| `openrouter_generate_image` | Generate images via OpenRouter |
| `openrouter_generate_video` | Submit asynchronous video generation |
| `openrouter_video_status` | Poll a video job's status |
| `openrouter_download_video` | Download a completed video to the configured output directory |

### B.AI direct-connection recovery without a VPN

If `https://api.b.ai/v1/models` times out locally while the key is known to be valid, the network is usually blocking the `api.b.ai` DNS or TLS route rather than rejecting the key. The plugin includes a loopback-only B.AI relay: it forwards DSH `/v1/*` requests through a reachable B.AI entry while using the `api.b.ai` host and certificate name. No VPN is required, and the key remains in DSH credentials. “Switching strategy” always stays inside B.AI: the provider, model, API key, and request path remain unchanged; only the connection host, DNS address, or direct-versus-accelerator route changes. The relay opens a fresh HTTPS socket for every attempt, dynamically resolves and rotates DNS addresses, and moves replayable requests to the next B.AI strategy after a transient failure. Press `Alt+M` and open Relay config to copy a `127.0.0.1` Base URL and provider template using the current DSH port.

Change the affected B.AI provider `baseURL` to the following value and restart `dsh web`:

```yaml
llm-pi-ai:
  providers:
    bailsb:
      apiKeyEnv: BAILSB_API_KEY
      api: openai-responses
      baseURL: http://127.0.0.1:3080/model-palette/api/bai-relay/v1
      models:
        - id: deepseek-v4-flash
    baiwhr:
      apiKeyEnv: BAIWHR_API_KEY
      api: openai-responses
      baseURL: http://127.0.0.1:3080/model-palette/api/bai-relay/v1
      models:
        - id: deepseek-v4-flash
```

The relay accepts only direct `127.0.0.1` / `::1` requests and has a fixed B.AI destination; it is not an open proxy. Its default strategies are: the current DNS address for the AWS Global Accelerator entry, the next address for that same accelerator hostname, and direct `api.b.ai`. `503`, `502`, `504`, explicit Cloudflare 403 pages, rate limits, and transient socket failures move to the next B.AI strategy; the relay returns `503 UPSTREAM_TRANSIENT` only after all attempts fail. A 401 from `/v1/models` means the request reached B.AI, so check the credential first. Large non-replayable requests preserve the original B.AI HTTP error instead of being replayed. If B.AI changes its accelerator entry, override the full chain with `baiRelay.strategies` in the plugin configuration.

The built-in relay retry settings belong to the plugin config, not the provider profile:

```yaml
- id: dsh-model-palette
  config:
    baiRelay:
      upstreamRetries: 2
      retryDelaysMs: [250, 1000]
      retryBodyLimitBytes: 16777216
      strategies:
        - id: aws-global-accelerator
          upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
          hostHeader: api.b.ai
          tlsServerName: a18ccd091ab831ac3.awsglobalaccelerator.com
          certificateHost: api.b.ai
          addressIndex: 0
        - id: aws-global-accelerator-next-address
          upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
          hostHeader: api.b.ai
          tlsServerName: a18ccd091ab831ac3.awsglobalaccelerator.com
          certificateHost: api.b.ai
          addressIndex: 1
        - id: direct-api
          upstreamHost: api.b.ai
          hostHeader: api.b.ai
          tlsServerName: api.b.ai
          certificateHost: api.b.ai
          addressIndex: 0
```

`upstreamRetries` is the number of extra attempts for the same B.AI request; the default `2` covers the three strategies above in order. Relay transport recovery and the provider/model request-retry rules below are separate layers, and neither layer switches to another provider.

### Extend the relay to another provider

For another provider whose key works but canonical domain is unreachable locally, declare a named fixed-destination relay in plugin configuration. Each relay has an ID, fixed HTTPS connection host, original API Host, TLS SNI, certificate validation name, and allowed path prefix. Browser requests cannot choose an upstream dynamically.

```yaml
- id: dsh-model-palette
  config:
    providerRelays:
      example-provider:
        upstreamHost: reachable-entry.example.net
        hostHeader: api.provider.example
        tlsServerName: reachable-entry.example.net
        certificateHost: api.provider.example
        allowedPathPrefix: /v1/
        timeoutMs: 180000
        upstreamRetries: 2
        retryDelaysMs: [250, 1000]
        retryBodyLimitBytes: 16777216
```

After restarting `dsh web`, set the provider Base URL to `http://127.0.0.1:3080/model-palette/api/relay/example-provider/v1`. If DSH uses another port, copy the current loopback address from Relay config. Configure only a verified alternate entry for the same provider API; never place an unknown site, secret, or dynamic URL in relay configuration.

## 🎮 Using the Palette

### Basic Usage

| Action | How |
|--------|-----|
| Open palette | Press **<kbd>Alt+M</kbd>** or click the ⌘ model trigger |
| Close palette | Press **<kbd>Esc</kbd>** or click outside the dialog |
| Search | Type into the search field — matches model name, model ID, provider name, provider ID, and description |
| Navigate | **<kbd>↑</kbd>** / **<kbd>↓</kbd>** arrow keys |
| Select | **<kbd>Enter</kbd>** on the highlighted row |
| Filter by provider | Click a provider in the left rail |
| Show favorites only | Click **Favorites only** in the left rail |
| Show recent models | Click **Recent models** in the left rail |
| Toggle favorite | Click the ★ star on any model row |
| Switch reasoning effort | Use the footer dropdown; missing model declarations are added live |

### Configuration Panel

Press **<kbd>Alt+M</kbd>** and select **Model config** in the left rail to:

1. **Select or create a provider** — choose from the dropdown or click "Add provider"
2. **Duplicate a provider when useful** — start from a working route without reusing its credential reference
3. **Configure the endpoint** — set base URL, protocol, and credential reference
4. **Manage API keys** — enter a new key or load the stored one (loopback only)
5. **Test the connection** — click "Check connection" to discover models and immediately fill their disclosed or preset context, output, input, and reasoning metadata
6. **Choose OpenRouter free models** — scan the current usable `:free` catalog, search and inspect capacities, then import only the checked models
7. **Validate the API key** — send a minimal request through the selected model and protocol, then distinguish the active DSH runtime credential from a different unsaved key in the input
8. **Check all API keys** — sequentially test every configured runtime credential and open a failing provider directly from the results
9. **Test one live model** — send one minimal request to `/chat/completions` and `/responses` and show which actually works
10. **Check every model protocol** — classify the full configured catalog; large providers are scanned in batches and no configuration changes until confirmation
11. **Split Re/CC protocols** — keep Responses-capable models on the original provider and create a `-completions` branch containing only Chat Completions-only models
12. **Configure provider retries** — keep the DSH policy or set an exact transient-failure retry count for the route
13. **Override retries per model** — inherit, explicitly disable retries, or set a model-only count
14. **Configure models** — filter long lists, copy parameters, and set context window, max output, input types, and reasoning wire values
15. **Enable universal reasoning** — add all seven DSH levels to one model or every declared model on the route
16. **Apply presets** — auto-fill from the registry or select manually
17. **Repair known dialect compatibility** — use **Repair and apply** when a DeepSeek-compatible route lacks historical `reasoning_content` replay fields; normal model selection also runs the preflight automatically
18. **Save safely** — duplicate IDs are rejected, and unsaved edits are clearly marked before switching or reloading
19. **Delete a provider** — remove its settings profile after confirmation; its credential is intentionally kept

API key validation reports whether the credential is usable, invalid, blocked, unavailable, missing, or inconclusive. It never treats a public `/models` response as proof that a key can run conversations and uses the same streaming mode as DSH conversations. **Check all API keys** runs real requests sequentially to reduce rate-limit pressure and shows the provider, credential reference, source, protocol, model, and diagnostic. The active DSH runtime credential is tested separately from a different unsaved input key, and all keys stay on the plugin backend. Each request may incur a small charge.

Selective request retry rules live in the plugin's `dsh-model-palette` settings namespace and apply live. A provider rule owns recovery only for that route; an exact model override wins over it. B.AI/BankOfAI aliases (`b.ai`, `bai`, `bailsb`, `baiwhr`, and `bankofai`) default to 50 retries. `N` means retries after the first failed request, so `50` can produce at most `51` billable attempts. Only transport errors, timeouts, rate limits, server errors, empty responses, and explicit Cloudflare/WAF 403 pages retry. Invalid credentials, quota exhaustion, malformed requests, missing models, and context overflow remain terminal. Setting a model override to `0` explicitly disables recovery for that model; routes without plugin rules continue through the normal DSH recovery chain. These provider/model rules are separate from the relay's own transport recovery: the relay handles socket setup failures before DSH receives a response, while this namespace handles failures reported by the DSH request path.

If an explicit Cloudflare/WAF 403 keeps failing after its retry budget, the failure is relabeled as a provider block so the conversation does not misleadingly report `API key is invalid`. Retries cannot bypass a permanent WAF rule; request content, size, frequency, account policy, or the gateway itself may still need correction.

Reasoning effort is a model capability declaration, not a protocol selector. New OpenAI-compatible routes start on `openai-responses`, but real endpoint checks remain authoritative. **Check every model protocol** sends bounded requests for each explicit model. Models that accept Responses stay on the primary route even when both protocols work; models that reject Responses but accept Chat Completions can be moved, after a preview and confirmation, to a generated collision-safe `provider-completions` branch. Undetermined models are never moved automatically. The split preserves the endpoint, credential reference, model capacities, inputs, reasoning declarations, valid compatibility fields, and provider/model retry rules.

OpenRouter free-model discovery uses the public `/api/v1/models` catalog and accepts only explicit `:free` variants that produce text and have at least one DSH-supported input (`text` or `image`). The check requires no API key and changes no provider settings. The picker leaves everything unchecked by default, supports search and manual selection, previews context/output/input capabilities, and imports only the checked entries. Import fills missing metadata and presets without overwriting manual fields or deleting unselected local models.

Live protocol probing sends real requests capped at 16 output tokens and may incur a small charge. The cap avoids false negatives from gateways that reject one-token probes. Full-catalog checks use batches of at most 100 models per backend request and may send up to two model requests per entry. The plugin never changes protocol based solely on reasoning capability and never writes a split before explicit confirmation.

### Media Tools Panel

Press **<kbd>Alt+M</kbd>** and select **Media tools** in the left rail:

1. The panel loads the live OpenRouter image/video catalog
2. Models reported as **free** run without restrictions
3. Models **not reported as free** require a one-time charge acknowledgement for each request
4. Image generation runs synchronously and saves to the output directory
5. Video generation submits an async job — check status and download when complete

## 🛠️ Development

```sh
# Clone the repository
git clone https://github.com/Jensen-Yao/dsh-model-palette.git
cd dsh-model-palette

# Install dependencies
pnpm install

# Run type check, tests, and build
pnpm check

# Build only
pnpm build

# Run tests
pnpm test
```

Prebuilt `lib/` files are committed to the repository so GitHub-based installs do not need build scripts.

### Project Structure

```
dsh-model-palette/
├── src/
│   ├── client/              # Frontend React components
│   │   ├── index.tsx        # Client entry point & slot registration
│   │   ├── ModelPalette.tsx  # Main palette component
│   │   ├── ConfigPanel.tsx   # Provider & model config UI
│   │   ├── MediaPanel.tsx    # OpenRouter media tools UI
│   │   ├── model.ts          # Search, ranking, favorites logic
│   │   ├── model-config.ts   # Configuration data utilities
│   │   ├── selection-compatibility.ts # DeepSeek compatibility preflight before selection
│   │   ├── model-presets.ts  # Preset registry management
│   │   ├── config-api.ts     # Config API client
│   │   ├── media-api.ts      # Media API client
│   │   ├── locales.ts        # i18n (en & zh)
│   │   ├── types.ts          # TypeScript types
│   │   └── style.css         # Component styles
│   ├── index.js              # Plugin entry point (server-side)
│   ├── openrouter-media.js   # OpenRouter media backend
│   ├── model-config-api.js   # Model config API backend
│   ├── request-retry-settings.js # Live provider/model retry settings
│   └── media-protocol.ts     # Shared protocol constants
├── assets/
│   ├── icon.svg              # Plugin icon
│   └── model-presets.json    # Bundled model presets
├── docs/
│   └── openrouter-media.zh-CN.md  # Media tools documentation (zh)
├── tests/
│   ├── model.test.ts
│   ├── model-config.test.ts
│   ├── model-presets.test.ts
│   ├── media-api.test.ts
│   ├── model-config-api.test.js
│   └── openrouter-media.test.js
├── lib/                      # Prebuilt output
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── cordis.patch.yml
```

## 📋 Requirements

- **Node.js** >= 22.19
- **DeepSeek Harness** >= 4.0.1
- **pnpm** >= 11.21 (for development)

## 📄 License

[MIT](LICENSE) © Jensen Yao

---

<div align="center">
  <sub>Built with ❤️ for the DeepSeek Harness ecosystem</sub>
</div>
