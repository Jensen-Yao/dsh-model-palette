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

## 🚀 Quick Start

### Install

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette
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
| Toggle favorite | Click the ★ star on any model row |
| Switch reasoning effort | Use the dropdown in the footer (visible when the active model supports it) |

### Configuration Panel

Press **<kbd>Alt+M</kbd>** and select **Model config** in the left rail to:

1. **Select or create a provider** — choose from the dropdown or click "Add provider"
2. **Configure the endpoint** — set base URL, protocol, and credential reference
3. **Manage API keys** — enter a new key or load the stored one (loopback only)
4. **Test the connection** — click "Check connection" to discover models
5. **Configure models** — set context window, max output, input types per model
6. **Apply presets** — auto-fill from the registry or select manually
7. **Save** — writes provider profiles through DSH settings and keys through credentials

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
│   │   ├── model-presets.ts  # Preset registry management
│   │   ├── config-api.ts     # Config API client
│   │   ├── media-api.ts      # Media API client
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