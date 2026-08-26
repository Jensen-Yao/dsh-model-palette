# dsh-model-palette

A global model command palette for DeepSeek Harness Web. Press **Alt+M** or click the composer trigger, then find a route by provider name, provider ID, model name, model ID, or description in one search field.

## Features

- Global **Alt+M** shortcut.
- The dialog renders at document level, so skins that hide native composer controls cannot hide the palette with them.
- One fuzzy search surface for providers and models.
- Provider filter rail with model counts.
- Current model, favorites, and recently used routes ranked first.
- Provider-scoped identities keep same-named models separate.
- Reasoning effort selector for the active model.
- Visible provider catalog failures and retry.
- A model-configuration view for custom provider names, base URLs, protocols, credential refs, and model parameters.
- Masked API keys, connection checks, and stored-key reveal only through direct `127.0.0.1` or `localhost` access—not LAN or reverse proxies.
- Bundled and GitHub-refreshable presets for verified context windows, maximum outputs, and text/image inputs; unknown aliases are never guessed.
- Optional OpenRouter image/video tools with paid generation blocked by default.
- A media-tools view that reads the full live catalog, permits explicit one-time manual attempts for models not reported free, and runs actions without writing conversation messages.

## Install

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette
```

Restart `dsh web`, then press **Alt+M**.

## Provider and model configuration

Press **Alt+M** and select **Model config** in the left rail. The panel writes provider profiles through DSH `settings.mutate`, writes new keys through `credentials.set`, and checks OpenAI-compatible endpoints through `llm.discoverModels`. `openai-responses` is a wire protocol, not an Agent mode; choose it only when the provider endpoint supports it.

Each model row edits context capacity, maximum output, text/image inputs, and common compatibility switches while retaining unexposed advanced fields. Exact model aliases can fill missing values from the verified preset registry. Private gateway aliases can select an official preset manually. The registry loads from GitHub when available and falls back to the bundled copy offline.

Stored credentials do not travel through the public DSH credentials RPC. The optional reveal action uses a plugin route that requires a loopback remote address, loopback Host and Origin, and no forwarding headers. LAN and tunnel clients may replace a key but cannot read the stored value.

## Optional OpenRouter media tools

The bundle does not enable media tools for other users by default. Add a profile patch when needed:

```yaml
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

This registers:

- `openrouter_media_models`
- `openrouter_generate_image`
- `openrouter_generate_video`
- `openrouter_video_status`
- `openrouter_download_video`

The generation tools query live pricing before submission. Agent tool calls are rejected unless the corresponding paid-generation flag is explicitly enabled. The direct media panel can make a one-time manual attempt without changing that global setting, but only after the user acknowledges that the request may be charged.

Press **Alt+M** and select **Media tools** in the left rail. The panel calls the plugin's same-origin API and loads the full live OpenRouter catalog into model selectors. Models reported free run normally. Models not reported free remain selectable because promotional access may not appear in pricing data; when the global paid-generation flag is off, the panel requires a visible possible-charge acknowledgement for every individual submission. That acknowledgement resets after the request and is unavailable to agent tools. Generation, status, and download actions run directly without sending prompts to the current conversation. The backend checks live pricing again before each generation. The OpenRouter credential is resolved only by the DSH credentials service on the host and is never returned to the browser.

The five agent tools remain registered for model-driven workflows, but the media panel no longer depends on the active model understanding or calling them. See [`docs/openrouter-media.zh-CN.md`](docs/openrouter-media.zh-CN.md) for the Chinese explanation and safety model.

## Development

```sh
pnpm install
pnpm check
```

Prebuilt `lib/` files are committed so GitHub installs do not need build scripts.

## License

MIT
