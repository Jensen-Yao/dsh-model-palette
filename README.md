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

Current release: [v0.5.5](https://github.com/Jensen-Yao/dsh-model-palette/releases/tag/v0.5.5)

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Global Command Palette
- **<kbd>Alt+M</kbd>** shortcut works from anywhere
- Renders at the document level — skins that hide native composer controls cannot hide the palette
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

### 🧠 Reasoning Effort Selector
- When the active model supports reasoning levels, a dropdown appears in the footer
- Switch between effort levels (low, medium, high) on the fly
- Provider-specific default effort applied automatically

</td>
</tr>
<tr>
<td width="50%">

### ⚙️ Provider & Model Configuration
Add, edit, or remove provider profiles directly from the UI:
- Configure **provider ID**, **display name**, **base URL**, and **protocol** (`openai-completions`, `openai-responses`, `anthropic-messages`)
- Set **credential reference** and **API key** (masked by default)
- **Test connection** via `llm.discoverModels` and import discovered models
- Duplicate a working provider into a new draft with a separate credential reference
- Duplicate model parameters, filter long model lists, and reject duplicate model IDs before saving
- Auto-repair known DeepSeek-dialect replay fields before switching models on custom OpenAI-compatible gateways
- List affected models missing `thinkingFormat` / `reasoning_content` replay settings and provide one-click repair in the config panel
- Warn before discarding unsaved edits and protect drafts with a browser unload guard
- Security: stored keys can only be revealed through direct `127.0.0.1` / `localhost` access

</td>
<td width="50%">

### 📦 Model Presets
- **Bundled presets** for verified context windows, max outputs, and input types
- **Online refresh** from GitHub — always up-to-date
- **Auto-fill** missing parameters for exact model matches
- **Manual preset selection** for private gateway aliases
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

## Skin Center v2 compatibility

The package remains a standard DSH client plugin. Skin Center v2 owns `skin.json`, `skin.css`, `patches.css`, and `hooks.mjs`; `dsh-model-palette` does not pretend to be a skin and does not add a second skin manifest. When a v2 skin is active, the palette stays usable through the native slot, document-level portal, and keyboard shortcut.

The client exposes `data-dsh-plugin="dsh-model-palette"` on its launcher and dialog roots so v2 skins can target the plugin without generated class names. The normal DSH client loader discovers and mounts the bundle through `dsh.client`; the v2 bridge is installed at plugin activation and remains usable even when the composer mounts later. A v2 skin can open the model, media, or config view through this stable browser event:

```js
window.dispatchEvent(new CustomEvent('dsh-model-palette:open', { detail: { view: 'media' } }))
```

`view` accepts `models`, `media`, or `config`; omitted or unknown values open the model view. Hooks that need direct view switching can also use the page bridge:

```js
window.__DSH_MODEL_PALETTE__?.open('config')
```

If a skin can activate before this plugin, use the `dsh-model-palette:ready` handshake instead of making one optional-chaining call:

```js
function openModelPaletteWhenReady(view = 'models') {
  const retry = () => window.__DSH_MODEL_PALETTE__?.open(view)
  window.addEventListener('dsh-model-palette:ready', retry, { once: true })
  if (retry() === true) window.removeEventListener('dsh-model-palette:ready', retry)
}

openModelPaletteWhenReady('media')
```

The `ready` event fires after the plugin component mounts; when the bridge exists but the component does not, `open()` queues the request. The event and page bridge stay local to the current browser page and carry no credentials or conversation content. The launcher deliberately avoids a class name containing `seat`, because workbook skins may hide native composer seat carriers with `[class*="seat"]`. `skinManifestVersion: 2` remains a `skin.json` concern; this project remains a normal DSH `dsh.client` plugin and does not pretend to be a skin.

## 🚀 Quick Start

### Install

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette#v0.5.5
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
| Switch reasoning effort | Use the dropdown in the footer (visible when the active model supports it) |

### Configuration Panel

Press **<kbd>Alt+M</kbd>** and select **Model config** in the left rail to:

1. **Select or create a provider** — choose from the dropdown or click "Add provider"
2. **Duplicate a provider when useful** — start from a working route without reusing its credential reference
3. **Configure the endpoint** — set base URL, protocol, and credential reference
4. **Manage API keys** — enter a new key or load the stored one (loopback only)
5. **Test the connection** — click "Check connection" to discover models
6. **Validate the API key** — send a minimal request through the selected model and protocol, then distinguish the active DSH runtime credential from a different unsaved key in the input
7. **Test the live protocol** — send one minimal request to `/chat/completions` and `/responses` and show which actually works
8. **Configure models** — filter long lists, copy parameters, and set context window, max output, and input types
9. **Apply presets** — auto-fill from the registry or select manually
10. **Repair known dialect compatibility** — use **Repair and apply** when a DeepSeek-compatible route lacks historical `reasoning_content` replay fields; normal model selection also runs the preflight automatically
11. **Save safely** — duplicate IDs are rejected, and unsaved edits are clearly marked before switching or reloading
12. **Delete a provider** — remove its settings profile after confirmation; its credential is intentionally kept

API key validation reports whether the credential is usable, invalid, blocked by a provider or gateway, unavailable because of quota/rate limits, or inconclusive because the endpoint/model does not support the check. It never treats a public `/models` response as proof that a key can run conversations, uses the same streaming mode as DSH conversations, and identifies Cloudflare block pages as gateway rejection rather than invalid credentials. The active DSH runtime credential is tested separately from a different unsaved input key, and both keys stay on the plugin backend. A successful minimal request does not guarantee that Cloudflare or another WAF will accept a larger full-conversation payload. Each request may incur a small charge.

Live protocol probing sends real requests capped at 16 output tokens and may incur a small charge. The cap avoids false negatives from gateways that reject one-token probes. The plugin never changes protocol based solely on reasoning capability.

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
│   │   ├── skin-v2.ts         # Skin Center v2 page bridge
│   │   ├── locales.ts        # i18n (en & zh)
│   │   ├── types.ts          # TypeScript types
│   │   └── style.css         # Component styles
│   ├── index.js              # Plugin entry point (server-side)
│   ├── openrouter-media.js   # OpenRouter media backend
│   ├── model-config-api.js   # Model config API backend
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
